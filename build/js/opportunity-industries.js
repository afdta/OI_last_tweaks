import {industry_data, industry_names, cbsas} from './industry-data.js';
import small_map from "./small-map.js";

export default function opportunity_industries(container, scope){
    
    var wrap = d3.select(container).append("div");

    var lookup = {};
    cbsas.forEach(function(d){
        lookup[d.code] = d.name;
    });

    var header = wrap.append("div").classed("c-fix",true).style("margin","0px 0px 15px 0px");

    var map_wrap = header.append("div").style("float","left");
    var update_map = small_map(map_wrap.node());

    var title = header.append("p").classed("mi-title2",true);

    //bars root
    var bar_wrap_ = wrap.append("div").classed("c-fix",true).style("margin","0px");
        
    bar_wrap_.append("p").style("color","#ffaaaa").html('To do: (1) revise color palette;<br />(2) annotate with values and/or add x-axes; <br/>(3) insert concise language defining these terms; <br />(4) make bars sortable?; <br/>(5) make layout responsive; <br />(6) Note that bars may not sum to 100% (pad with undefined values?); <br />(7) Consider not stacking to 100% or providing a toggle that stacks to percentage of total jobs. Some industries are quite small (e.g. mining)');
    
    bar_wrap_.append("p").html('Percentage of jobs in each industry that are ' +
                                '<span class="key-swatch good-jobs">Good jobs</span> ' + 
                                '<span class="key-swatch promising-jobs">Promising jobs</span> ' +
                                '<span class="key-swatch hi-jobs">High-skill jobs</span> '+
                                '<span class="key-swatch other-jobs">Other jobs</span>')
                                .style("font-weight","bold")
                                .style("margin","0px 15px")
                                .style("padding","15px")
                                .style("text-align","center");

    var bar_wrap = bar_wrap_.append("div").style("width","100%").style("border-top","1px solid #aaaaaa").style("margin","0px auto");


    var svg = bar_wrap.append("svg").attr("width","100%").attr("height","500px");

    var g_axis = svg.append("g");
    var g_bars = svg.append("g");
    var g_labels = svg.append("g");

    var x = d3.scaleLinear().domain([0,1]).range([30,90]);

    var width = function(v){
        if(v==null){
            return 0;
        }
        else{
            return x(v) - x(0);
        }
    }

    var segment_labels = {g:"Good", p:"Promising", hi:"High-skilled", o:"Other"}
    var segment_fill = {g:"#394d9c", p:"#52d0a8", hi:"#ffa200", o:"#777777"}

    function layout(g){
        var s = ["g", "p", "hi", "o"];
        
        var xcum = x(0);
        var o = [];
        s.forEach(function(d,i){
            var v = g[d];
            var w = width(v);
            o.push({x:xcum, width:w, value:v, label:segment_labels[d], fill:segment_fill[d]});
            xcum = xcum + w;
        });

        return {segments:o, industry: g.naics===null ? "All jobs" : industry_names[g.naics], naics:g.naics, obs:g};
    }

    var bar_height = 15;
    var bar_pad = 10;
    var top_pad = 10;

    //update function to be passed to metro select
    function update(cbsa){

        title.text(lookup[cbsa]);
        update_map(cbsa);

        var data = industry_data[cbsa].map(layout);
        data.sort(function(a,b){return d3.descending(a.obs.g+a.obs.p, b.obs.g+b.obs.p)})
        //data.sort(function(a,b){return a.naics === null ? 1 : 
        //                               b.naics === null ? -1 : d3.ascending(a.naics, b.naics)});

        //stacked
        var igroups_ = g_bars.selectAll("g").data(data, function(d,i){return d.industry});
            igroups_.exit().remove();
        var igroups = igroups_.enter().append("g").merge(igroups_);

        igroups.transition().duration(1000).attr("transform", function(d,i){
            return "translate(0," + (i*(bar_height+bar_pad)+top_pad) + ")"
        })

        var segment_labels = igroups.selectAll("text").data(function(d){return [d.industry]});
        segment_labels.enter().append("text").merge(segment_labels)
                                .text(function(d){return labeler(d,35)})
                                .attr("dy",bar_height-3)
                                .attr("x", x(0)+"%")
                                .attr("dx",-4)
                                .attr("text-anchor","end");

        var segments = igroups.selectAll("rect").data(function(d){return d.segments}, function(d){return d.label})

        segments.exit().remove();
        segments.enter().append("rect").merge(segments)
                .attr("y","0")
                .attr("fill", function(d){return d.fill})
                .attr("stroke", function(d){return d3.color(d.fill).darker()})
                .attr("stroke-width","0")
                .attr("height", bar_height)
                .transition().duration(1000).delay(1000)
                .attr("x", function(d){return d.x+"%"})
                .attr("width", function(d){return d.width+"%"})
                ;
        
        svg.attr("height", ((data.length*(bar_height+bar_pad))+(2*bar_pad))+"px" );
    }

    function labeler(txt, nchars){
        //keep first word
        var first_word = txt.replace(/\s.*$/, "");
        var remaining = txt.replace(/^[^\s]*\s/, " ");
        
        var n = remaining.length;
        var l = first_word.length;
        
        while(l < nchars && l < txt.length){
            first_word = first_word + txt.substring(l, l+1);
            l++;
        }
    
        if(first_word != txt){
            first_word = first_word + "...";
        }
    
        return first_word;
    }


    return update;    
}

