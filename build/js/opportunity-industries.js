import {industry_data, industry_names} from './industry-data.js';
import {metro_select, lookup} from "./select-factory.js";
import small_map from "./small-map.js";

export default function opportunity_industries(container, scope){
    
    var wrap = d3.select(container).append("div");

    var header = wrap.append("div").classed("as-table",true)
                        .style("margin","0px 0px 22px 0px")
                        .append("div");
        
    var title_cell = header.append("div")
    title_cell.append("p").text("Opportunity industries in:").style("color","#555555").style("margin","0px 0px 5px 0px").style("font-style","italic");
    var title = title_cell.append("p").classed("mi-title2",true).style("margin","0px");

    var map_wrap = header.append("div").style("width","150px").append("div");
    var update_map = small_map(map_wrap.node());

    

    var split = wrap.append("div").classed("mi-split c-fix",true);


    var legend = split.append("div").style("border-right","0px solid #aaaaaa").style("padding-right","10px");
    legend.append("p").html('<strong>Percentage of jobs in each industry that are good, promising, high-skill, or other jobs</strong>');
    
    legend.append("p").html('<span class="key-swatch promising-jobs">Promising jobs</span><br /><em>Held by workers without a bachelor\'s degree</em>').style("color","#555555") 
    legend.append("p").html('<span class="key-swatch good-jobs">Good jobs</span><br /><em>Held by workers without a bachelor\'s degree</em>').style("color","#555555");    
    legend.append("p").html('<span class="key-swatch hi-jobs">High-skill jobs</span><br /><em>Good and promising jobs held by workers with a bachelor\'s degree</em>').style("color","#555555")
    legend.append("p").html('<span class="key-swatch other-jobs">Other jobs</span><br /><em>All other jobs</em>').style("color","#555555")


    
    //bars root                            
    var bar_wrap = split.append("div").style("border-top","0px solid #aaaaaa").style("margin","0px auto");

    var svg = bar_wrap.append("svg").attr("width","100%").attr("height","500px");

    var axis_height = 45;
    var g_axis = svg.append("g").attr("trasnform","translate(0.5,0)");
    var g_bars = svg.append("g").attr("transform","translate(0.5,0)");
    var labels_width = 140;
    var bars_width = 150;
    var min_anno_width = 30;

    var x = d3.scaleLinear().domain([0,1]).range([labels_width, bars_width+labels_width]);

    var width = function(v){
        if(v==null){
            return 0;
        }
        else{
            return x(v) - x(0);
        }
    }

    var segment_labels = {g:"Good", p:"Promising", hi:"High-skilled", o:"Other"}
    var segment_fill = {g:"#394d9c", p:"#52d0a8", hi:"#ffa200", o:"#888888", "u":"#bbbbbb"}

    function layout(g){
        var s = ["p", "g", "hi", "o", "u"];
        
        var xcum = x(0);
        var o = [];
        s.forEach(function(d,i){
            var v = g[d];
            var w = width(v);
            o.push({x:xcum, width:w, value:v, label:segment_labels[d], fill:segment_fill[d], text_fill:"#eeeeee"});
            xcum = xcum + w;
        });

        return {segments:o, industry: g.naics===null ? "All jobs" : industry_names[g.naics], naics:g.naics, obs:g};
    }

    var bar_height = 15;
    var bar_pad = 10;
    var top_pad = 10;

    var current_cbsa = null;
    function update(cbsa){

        //record currently selected cbsa
        current_cbsa = cbsa;

        resize();

        add_ticks(g_axis, x);

        title.text(lookup[cbsa]);
        update_map(cbsa);

        var data = industry_data[cbsa].map(layout);
        data.sort(function(a,b){
            if(a.industry == "All jobs"){
                return -1;
            }
            else if(b.industry == "All jobs"){
                return 1;
            }
            else{
                return d3.descending(a.obs.g+a.obs.p, b.obs.g+b.obs.p);
            }
        });

        //stacked
        var igroups_ = g_bars.selectAll("g").data(data, function(d,i){return d.industry});
            igroups_.exit().remove();
        var igroups = igroups_.enter().append("g").merge(igroups_);

        igroups.transition().duration(1000).attr("transform", function(d,i){
            var y = i*(bar_height+bar_pad)+top_pad;
            if(i > 0){y = y+bar_height};

            return "translate(0," + y + ")"
        })

        var group_labels = igroups.selectAll("text.industry-name").data(function(d){return [d.industry]});
        group_labels.enter().append("text").classed("industry-name",true).merge(group_labels)
                                .text(function(d){return d})
                                .attr("dy",bar_height-3)
                                .attr("x", x(0))
                                .attr("dx",-4)
                                .attr("text-anchor","end")
                                .style("font-weight", function(d){return d=="All jobs" ? "bold" : "normal"});

        var segments = igroups.selectAll("rect").data(function(d){return d.segments}, function(d){return d.label});

        segments.exit().remove();
        segments.enter().append("rect").merge(segments)
                .attr("y","0")
                .attr("fill", function(d){return d.fill})
                .attr("stroke", function(d){return d3.color(d.fill).darker()})
                .attr("stroke-width","0")
                .attr("height", bar_height)
                .transition().duration(1000).delay(0)
                .attr("x", function(d){return d.x})
                .attr("width", function(d){return d.width})
                ;

        var min_anno_val = x.invert(labels_width + min_anno_width);

        var segment_labels = igroups.selectAll("text.segment-label").data(function(d){return d.segments}, function(d){return d.label})
        segment_labels.exit().remove();
        segment_labels.enter().append("text").classed("segment-label",true).merge(segment_labels)
                .attr("y","0")
                .attr("dy", bar_height-3)
                .style("font-size","13px")
                .style("fill", function(d){return d.text_fill})
                .attr("text-anchor","middle")
                .style("visibility", function(d){return d.value > min_anno_val ? "visible" : "hidden"})
                .text(function(d){return (Math.round(d.value*1000)/10)+"%"})
                .transition().duration(1000).delay(0)
                .attr("x", function(d){return (d.x + (d.width/2))})
                ;
        
        var svg_height = (data.length*(bar_height+bar_pad))+(2*bar_pad);

        g_axis.attr("transform","translate(0.5," + svg_height + ")");
        svg.attr("height", (svg_height+axis_height)+"px" );
    }

    function resize(){
        try{
            var box = bar_wrap.node().getBoundingClientRect();
            var w = box.right - box.left;
            bars_width = w - labels_width;

            if(bars_width < 100){
                throw new Error("Too narrow");
            }
        }
        catch(e){
            bars_width = 100;
        }

        x.range([labels_width, w-1]);
    }

    //initialize
    setTimeout(function(){
        update(scope.cbsa);

        metro_select(document.getElementById("opportunity-industries-select"), update);

        window.addEventListener("resize", function(){
            if(current_cbsa != null){
                update(current_cbsa);
            }
        });

    }, 0)    



    function add_ticks(g, scale){
        var ticks = [0,0.25,0.5,0.75,1];

        var ax = g.selectAll("line.axis-line").data([{x1:scale(0), x2:scale(1)}]);
        ax.exit().remove();
        ax.enter().append("line").classed("axis-line",true).style("opacity","0").merge(ax)
            .attr("y1", 0.5).attr("y2", 0.5)
            .attr("stroke","#aaaaaa")
            .transition().duration(1000)
            .attr("x1", function(d){return d.x1})
            .attr("x2", function(d){return d.x2})
            .style("opacity",1)
            ;


        var lines = g.selectAll("line.tick-mark").data(ticks);
        lines.exit().remove();
        lines.enter().append("line").classed("tick-mark",true).style("opacity","0").merge(lines)
            .attr("y1", 0).attr("y2", 7)
            .attr("stroke","#aaaaaa")
            .transition().duration(1000)
            .attr("x1", function(d){return scale(d)})
            .attr("x2", function(d){return scale(d)})
            .style("opacity",1)
            ;

        var text = g.selectAll("text.tick-mark").data(ticks);
        text.exit().remove();
        text.enter().append("text").classed("tick-mark",true).style("opacity","0").merge(text)
            .attr("y", 7).attr("dy",14)
            .text(function(d){return (d*100) + "%"})
            .style("font-size","14px")
            .attr("dx","0")
            .attr("text-anchor", function(d){return d==0 ? "start" : (d==1 ? "end" : "middle")})
            .transition().duration(1000)
            .attr("x", function(d){return scale(d)})
            .style("opacity",1)
            ;
    }


    return update;    
}

