import dir from "../../../js-modules/rackspace.js";

import {occ_flows, occ_shares, occ_names} from "./occupation-data.js";

import {metro_select, occ_select, edu_select, lookup} from "./select-factory.js";

//fallback for browsers without support for promises .. consider alt graphics or adding polyfills (https://github.com/github/fetch)

export default function flow_diagram(container, scope){
    //one time setup
    var wrap = d3.select(container).style("overflow","visible").style("min-width","360px");

    var metro_title = wrap.append("p").classed("mi-title2",true);

    var bar_height = 15;
    var text_height = 17;
    var top_pad = 10;
    var bot_pad = 45;
    var bar_pad = 5;
    
    var labels_width = 120;
    var bars_width = 120;

    var min_anno_width = 30;

    var fill = {opp:"#52d0a8", hi:"#ffa200", oth:"#777777"}    

    var header_panels = wrap.append("div").style("display","table").style("width","100%")
                            .style("table-layout","fixed").style("border-collapse","collapse")
                            .append("div").style("display","table-row");

    var left_header = header_panels.append("div").style("display","table-cell").style("vertical-align","top").style("padding-right","20px");
    var right_header = header_panels.append("div").style("display","table-cell").style("vertical-align","top").style("padding-right","20px");

    var edu_title0 = left_header.append("p").html("Share of all metro area workers ").style("margin","5px 0px").style("font-weight","bold").append("span");
    left_header.append("p").html("By occupation");
    left_header.append("p").html('<span style="margin-right:12px;" class="key-swatch promising-jobs">Good and promising jobs</span>' + 
                                 '<span class="key-swatch other-jobs">All other jobs</span>');

    var right_header_title = right_header.append("p").text("").style("margin","5px 0px").style("font-weight","bold");
    right_header.append("p").html("By the occupations they switched to");
    var right_header_example = right_header.append("p").style("font-style","italic");

    var svg_height = ((bar_height+bar_pad)*22)+top_pad+bot_pad;
    
    var svg = wrap.append("svg").attr("width","100%").attr("height", svg_height);
    
    var g_labels = svg.append("g");

    var g_leaders = svg.append("g");
    
    var g_right = svg.append("g").attr("transform","translate(" + (labels_width + bars_width) + ",0)");
    var g_right_axis = g_right.append("g").attr("transform","translate(0," + (svg_height-bot_pad) + ")");
    
    var g_right_path = g_right.append("path").attr("fill","none").attr("stroke","#555555")
                            .attr("d", "M0," + (top_pad-5.5) + " l-7,0 l0,"+(svg_height - (top_pad + bot_pad) + 5.5)+" l7,0")
                            .style("shape-rendering","crispEdges").attr("stroke-width","1");

    //g should be above g_right                        
    var g = svg.append("g").attr("transform","translate(" + labels_width + ",0)");
    var g_axis = g.append("g").attr("transform","translate(0," + (svg_height-bot_pad) + ")");
    
    var sub_ba = "Sub";

    function segment_data_retrieval(d, scale){
        var zero = scale(0);
        return [{id:"opp", 
                 val:d.opp, 
                 x:zero, 
                 width: scale(d.opp) - zero,
                 fill:fill.opp
                },
                {id:"oth", 
                 val:d.oth, 
                 x: scale(d.opp), 
                 width: scale(d.oth) - zero,
                 fill:fill.oth
                }
        ]
    }

    function draw_segments(g, g_axis, shares, Xscale, Yscale){
        var occ_groups_ = g.selectAll("g.g_bar").data(shares, function(d){return d.occ});
        occ_groups_.exit().remove()
        var occ_groups = occ_groups_.enter().append("g").classed("g_bar",true).merge(occ_groups_);

        occ_groups.transition().duration(900).attr("transform", function(d){
            var i = Yscale(d.occ);
            return "translate(0," + (i*(bar_height + bar_pad) + top_pad) + ")";
        })

        var segments = occ_groups.selectAll("rect").data(function(d){return segment_data_retrieval(d, Xscale)});

        segments.exit().remove();
        segments.enter().append("rect").merge(segments)
                .attr("height", bar_height)
                .attr("y","0")
                .attr("fill", function(d){return d.fill})
                .attr("y", 0)
                .transition()
                .duration(1200)
                .delay(0)
                .attr("x", function(d){return d.x})
                .attr("width", function(d){return d.width})
                ;

        var min_anno_val = Xscale.invert(min_anno_width);

        var segment_labels = occ_groups.selectAll("text.segment-label").data(function(d){return segment_data_retrieval(d, Xscale)});
        segment_labels.exit().remove();
        segment_labels.enter().append("text").classed("segment-label",true).merge(segment_labels)
                .attr("y","0")
                .attr("dy", bar_height-3)
                .style("font-size","13px")
                .style("fill", function(d){return "#ffffff"})
                .attr("text-anchor","middle")
                .style("visibility", function(d){return d.val > min_anno_val ? "visible" : "hidden"})
                .text(function(d){return (Math.round(d.val*1000)/10)+"%"})
                .transition().duration(1200).delay(0)
                .attr("x", function(d){return (d.x + (d.width/2))})
                ;

        //add axis
        var ticks = Xscale.ticks(3);

        var ax = g_axis.selectAll("line.axis-line").data([{x1:Xscale(0), x2:bars_width}]);
        ax.exit().remove();
        ax.enter().append("line").classed("axis-line",true).style("opacity","0").merge(ax)
            .attr("y1", 7).attr("y2", 7)
            .attr("stroke","#aaaaaa")
            .transition().duration(1200)
            .attr("x1", function(d){return d.x1})
            .attr("x2", function(d){return d.x2})
            .style("opacity",1)
            ;        

        var lines = g_axis.selectAll("line.tick-mark").data(ticks);
        lines.exit().remove();
        lines.enter().append("line").classed("tick-mark",true).style("opacity","0").merge(lines)
            .attr("y1", 7).attr("y2", 15)
            .attr("stroke","#aaaaaa")
            .transition().duration(1200)
            .attr("x1", function(d){return Xscale(d)})
            .attr("x2", function(d){return Xscale(d)})
            .style("opacity",1)
            ;

        var text = g_axis.selectAll("text.tick-mark").data(ticks);
        text.exit().remove();
        text.enter().append("text").classed("tick-mark",true).style("opacity","0").merge(text)
            .attr("y", 15)
            .attr("dy", 14)
            .text(function(d){return (d*100) + "%"})
            .style("font-size","13px")
            .attr("dx","0")
            .attr("text-anchor", function(d){return d==0 ? "start" : "middle"})
            .transition().duration(1200)
            .attr("x", function(d){return Xscale(d)})
            .style("opacity",1)
            ;



        return occ_groups;
    }


    //keep track of latest geo selected -- avoid callback confusion!
    var latest_geo = null;
    var latest_occ = 11;

    var middle_spacing = 40;
    var spacing_on_both = 20;

    function resize(){

        //get width, set scales
        try{
            var box = wrap.node().getBoundingClientRect();
            bars_width = ((box.right - box.left - labels_width - middle_spacing)/2) - spacing_on_both;
            if(bars_width < 75){
                throw new Error("Too narrow");
            }
        }
        catch(e){
            bars_width = 75 - (middle_spacing/2) - spacing_on_both;
        }

        g_right.attr("transform","translate(" + (labels_width + bars_width + middle_spacing + spacing_on_both) + ",0)");
        
        left_header.style("width", (labels_width + bars_width + middle_spacing + spacing_on_both - 7) + "px");
    }


    function update(cbsa){

        if(cbsa == null){
            cbsa = latest_geo;
        }
        else{
            latest_geo = cbsa;
        }

        resize();

        var max_share;
        
        try{
            var flow = occ_flows[cbsa][sub_ba];
            var shares = occ_shares[cbsa][sub_ba].slice(0);
            
            shares.sort(function(a,b){return d3.descending(a.opp, b.opp)})
            
            max_share = d3.max(shares, function(d){return d.opp + d.oth});
            var ordscale = d3.scaleOrdinal()
                             .domain(shares.map(function(d){return d.occ}))
                             .range(d3.range(0, shares.length));
            var xscale = d3.scaleLinear().domain([0, max_share]).range([0,bars_width]).nice();
                             
        }
        catch(e){
            flow = {};
            shares = [];
            max_share = 0;
            var ordscale = function(v){return 0}
            var xscale = d3.scaleLinear()
        }

        //labels
        var labels_ = g_labels.selectAll("text").data(shares)
        var labels = labels_.enter().append("text").merge(labels_)
            .attr("x",labels_width)
            .attr("y", function(d){
                var i = ordscale(d.occ);
                return (i*(bar_height + bar_pad) + top_pad);
            })
            .attr("text-anchor","end")
            .attr("dx","-4")
            .text(function(d){
                return occ_names[d.occ];
            })
            .style("font-size","14px").attr("dy", bar_height-4);


        draw_segments(g, g_axis, shares, xscale, ordscale).on("mousedown", function(d){
            latest_occ = d.occ;
            show_flows(flow, ordscale);
        }).style("cursor","pointer");

        show_flows(flow, ordscale);

        metro_title.text(lookup[cbsa]);
        edu_title0.text(sub_ba == "Sub" ? " without a college degree" : (sub_ba == "BA" ? " with a college degree" : ""));

    }

    function show_flows(flow_data, ordinalscale){
        these_shares = [];
        try{
            var these_shares = flow_data[latest_occ].slice(0);
            var max_share = d3.max(these_shares, function(d){return d.opp + d.oth});
         
            //less shifting of scales between metros, except for in less common cases
            if(max_share < 0.5){max_share = 0.5}
            
            var xscale = d3.scaleLinear().domain([0, max_share]).range([0, bars_width]).nice();
            if(these_shares.length == 0){
                throw new Error("no data");
            }
        }
        catch(e){
            these_shares = [];
            xscale = d3.scaleLinear();
        }

        console.log(these_shares);
        
        var yfn = function(oc){
            var y0 = ordinalscale(oc)*(bar_height + bar_pad) + top_pad;
            return (Math.floor(y0 + (bar_height/2)) + 0.5);
        }
        
        draw_segments(g_right, g_right_axis, these_shares, xscale, ordinalscale);

        var ledes = g_leaders.selectAll("line").data(these_shares);
        ledes.exit().remove();
        ledes.enter().append("line").merge(ledes)
              .attr("x1", labels_width)
              .attr("x2", labels_width + bars_width + middle_spacing + spacing_on_both - 7)
              .attr("stroke", function(d){
                  return d.occ == latest_occ ? "#555555" : "#dddddd";
              })
              .attr("stroke-dasharray", function(d){
                return d.occ == latest_occ ? null : "2,2";
            })
              .attr("y1", function(d){
                return yfn(d.occ)
              })
              .attr("y2", function(d){
                return yfn(d.occ)
            })
            .style("shape-rendering","crispEdges")
            ;

        right_header_title.html("Share of workers " +
                                (sub_ba == "Sub" ? "without a college degree" : (sub_ba == "BA" ? "with a college degree" : "")) +
                                " that started in " + occ_names[latest_occ].toLowerCase() + " occupations" );

        var example = "";

        if(these_shares.length > 1){
            var shares_copy = these_shares.slice(0);
            shares_copy.sort(function(a,b){return d3.ascending(a.opp, b.opp)});
            shares_copy.pop();
            var popped = shares_copy.pop();

            example = "Example: " + 
                    (Math.round(popped.opp * 1000)/10) + 
                    "% switched to good/promising " + 
                    occ_names[popped.occ].toLowerCase() + 
                    " jobs";
        }

        right_header_example.text(example).style("display", bars_width > 175 ? "block" : "none");

    }


    ///CACHING AND DATA RETRIEVAL BELOW

    //data cache
    var cache = {}



    //fetch, then update
    function fetch_and_update(geo){
        //record this request as the lates geo
        latest_geo = geo;

        //1) look in cache for data, if not there 2) fetch, store in cache, then update
        if(cache.hasOwnProperty(geo)){
            var data = cache[geo];
            //synchronous update
            update(data);
        }
        else{
            var url = dir.url("data", "msp.json");
            d3.json(url).then(function(data){
                //store data in cache
                cache[geo] = data;
                //if no subsequent requests have overridden this one, update with this geo and data
                if(geo == latest_geo){
                    update(cache[geo]);
                }
            });
        }

    }

    //initialize
    setTimeout(function(){
        update(scope.cbsa);

        //add controls
        var flow_select_wrap = document.getElementById("occupation-flows-select");

        metro_select(flow_select_wrap, function(cbsa){
            update(cbsa);
        })
    
        edu_select(flow_select_wrap, function(edu){
            if(edu == "Sub" || edu == "BA"){
                sub_ba = edu;
            }
            update();
        })
    
        occ_select(flow_select_wrap, function(occ){
            latest_occ = occ;
            update();
        })

        window.addEventListener("resize", function(){
            update();
        })        

    }, 0)



    return update;


    //return fetch_and_update;
}