import dir from "../../../js-modules/rackspace.js";

import {occ_flows, occ_shares, occ_names} from "./occupation-data.js";

//to do: fallback for browsers without support for promises .. consider alt graphics or adding polyfills (https://github.com/github/fetch)

export default function flow_diagram(container){
    //one time setup
    var wrap = d3.select(container).style("overflow","visible").style("min-width","480px");

    var bar_height = 15;
    var text_height = 17;
    var top_pad = 50;
    var bar_pad = 5;                 

    var fill = {opp:"#52d0a8", hi:"#ffa200", oth:"#aaaaaa"}    

    var header_panels = wrap.append("div").classed("c-fix",true);
    var panels = wrap.append("div").classed("c-fix",true);
    
    var left_panel = panels.append("div").style("width","50%").style("float","left").style("padding","0px 20px").append("div");
    var right_panel = panels.append("div").style("width","50%").style("float","left").style("padding","0px 20px").append("div");

    var left_header = header_panels.append("div").style("width","50%").style("float","left").style("padding","0px 20px").append("div");
    var right_header = header_panels.append("div").style("width","50%").style("float","left").style("padding","0px 20px").append("div");

    left_header.append("p").classed("mi-title3",true).text("Share of all metro area jobs")
    left_header.append("p").html('<span style="margin-right:12px;" class="key-swatch promising-jobs">Good and promising jobs</span>' + 
                                 '<span class="key-swatch other-jobs">All other jobs</span>');

    var right_header_title = right_header.append("p").classed("mi-title3",true).text("").style("visibility","hidden");

    var svg_height = ((bar_height+bar_pad)*22)+(top_pad*2);
    var svg = left_panel.append("svg").attr("width","100%").attr("height", svg_height);
    var g = svg.append("g");
    var g_anno = svg.append("g");
    var g_axis = svg.append("g").attr("transform","translate(0,40)");
    
    var g_axis_label = g_axis.append("text").attr("y",-25).attr("x","0%").text("Share of all metro area jobs");
    var g_axis_line = g_axis.append("line").attr("y1",0.5).attr("y2",0.5)
                        .attr("x1","0%").attr("x2",(100)+"%")
                        .attr("stroke","#aaaaaa");


    var call_to_action = right_panel.append("div").style("margin","0px 32px").style("border-radius","15px").style("background-color","#dddddd")
                            .style("padding","64px 32px").style("height", (svg_height-top_pad)+"px");
    call_to_action.append("p").style("max-width","250px").style("margin","0px auto").html("<strong>Click or tap on one of the bars to see which occupations those job-holders switched to.</strong>")


    var svg_right = right_panel.append("svg").attr("width","100%").attr("height",svg_height).style("display","none");
    var g_right = svg_right.append("g");
    var g_right_anno = svg_right.append("g");
    var g_right_axis = svg_right.append("g").attr("transform","translate(0,40)");
    
    var g_right_axis_label = g_right_axis.append("text").attr("y",-25).attr("x","0%").text("Share of selected occupation");
    var g_right_axis_line = g_right_axis.append("line").attr("y1",0.5).attr("y2",0.5)
                        .attr("x1","0%").attr("x2",(100)+"%")
                        .attr("stroke","#aaaaaa");


    var sub_ba = false;

    function add_ticks(g, scale, num){
        if(num == null){
            num = 4;
        }

        var ticks = scale.ticks(num);

        var lines = g.selectAll("line.tick-mark").data(ticks);
        lines.exit().remove();
        lines.enter().append("line").classed("tick-mark",true).style("opacity","0").merge(lines)
            .attr("y1", -5).attr("y2", 0.5)
            .attr("stroke","#aaaaaa")
            .transition().duration(1200)
            .attr("x1", function(d){return scale(d)+"%"})
            .attr("x2", function(d){return scale(d)+"%"})
            .style("opacity",1)
            ;

        var text = g.selectAll("text.tick-mark").data(ticks);
        text.exit().remove();
        text.enter().append("text").classed("tick-mark",true).style("opacity","0").merge(text)
            .attr("y", -7)
            .text(function(d){return (d*100) + "%"})
            .style("font-size","14px")
            .attr("dx","0")
            .attr("text-anchor", function(d){return d==0 ? "start" : "middle"})
            .transition().duration(1200)
            .attr("x", function(d){return scale(d)+"%"})
            .style("opacity",1)
            ;
    }

    //keep track of latest geo selected -- avoid callback confusion!
    var latest_geo = null;

    function update_(cbsa){

        if(cbsa == null){
            cbsa = latest_geo;
        }
        else{
            latest_geo = cbsa;
        }

        var width;
        var label_width; //in percent
        try{
            var box = left_panel.node().getBoundingClientRect();
            var width = box.right - box.left;
        }
        catch(e){
            width = 240;
        }

        var nchar = 35;
        if(width < 300){
            label_width = 50;
            nchar = 20;
        }
        if(width < 500){
            label_width = 40;
            nchar = 25;
        }
        else{
            label_width = 35;
            nchar = 30;
        }




        var max_share;
        try{
            var flow = occ_flows[cbsa][sub_ba ? "Sub" : "Total"];
            var shares = occ_shares[cbsa][sub_ba ? "Sub" : "Total"].slice(0);
            shares.sort(function(a,b){return d3.descending(a.opp, b.opp)})
            max_share = d3.max(shares, function(d){return d.opp + d.oth});
        }
        catch(e){
            flow = [];
            shares = [];
            max_share = 0;
        }

        var zero = label_width;
        var x_scale = d3.scaleLinear().domain([0, max_share]).range([zero, 95]).nice();
        var width = function(v){return x_scale(v) - zero;}

        add_ticks(g_axis, x_scale);
        g_axis_line.attr("x1", zero+"%");
        g_axis_label.attr("x", zero+"%");

        var occ_groups_ = g.selectAll("g.g_bar").data(shares, function(d){return d.occ});
        occ_groups_.exit().remove()
        var occ_groups = occ_groups_.enter().append("g").classed("g_bar",true).merge(occ_groups_);

        occ_groups.transition().duration(900).attr("transform", function(d,i){
            return "translate(0," + (i*(bar_height + bar_pad) + top_pad) + ")";
        })
        
        var segments = occ_groups.selectAll("rect").data(function(d){
            return [{id:"opp", 
                     val:d.opp, 
                     x:zero+"%", 
                     width:width(d.opp)+"%",
                     fill:fill.opp
                    },
                    {id:"oth", 
                     val:d.oth, 
                     x:(zero + width(d.opp))+"%", 
                     width:width(d.oth)+"%",
                     fill:fill.oth
                    }
                ]
        });

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

        //labels
        var labels_ = occ_groups.selectAll("text").data(function(d){return [{name: occ_names[d.occ], occ:d.occ}]});
        var labels = labels_.enter().append("text").merge(labels_).attr("x",zero+"%").attr("y", 0)
            .attr("text-anchor","end")
            .attr("dx","-4")
            .text(function(d){
                var txt = d.name.replace(/\s*Occupations\s*$/i, "");
                return labeler(txt, nchar)
            })
            .style("font-size","14px").attr("dy", bar_height-4);

        svg_right.style("display", "none");
        call_to_action.style("display","block");
        g_right.selectAll("g").remove(); 
        right_header_title.text("").style("visibility","hidden"); 

        occ_groups.on("mousedown", function(d){

            svg_right.style("display", null);
            call_to_action.style("display","none");

            //right
            var this_occ = d.occ;

            labels.style("font-weight",function(d){
                return d.occ == this_occ ? "bold" : "normal";
            })

            var these_shares = flow[d.occ].slice(0).sort(function(a,b){
                return d3.descending(a.opp+a.oth, b.opp+b.oth);
            });

            max_share = d3.max(these_shares, function(d){return d.opp + d.oth});
            var x_scale = d3.scaleLinear().domain([0, max_share]).range([zero, 95]).nice();
            var width = function(v){return x_scale(v) - zero;}
            g_right_axis_line.attr("x1", zero+"%");
            g_right_axis_label.attr("x", zero+"%");
            add_ticks(g_right_axis, x_scale);

            var groups_ = g_right.selectAll("g.g_bar").data(these_shares, function(d){return d.occ});
            groups_.exit().remove()
            var groups = groups_.enter().append("g").classed("g_bar",true).merge(groups_);

            groups.transition().duration(900).attr("transform", function(d,i){
                return "translate(0," + (i*(bar_height + bar_pad) + top_pad) + ")";
            })
            
            var seg = groups.selectAll("rect").data(function(d){
                
                var occ = d.occ + "";

                return [{id:"share", 
                        val:null, 
                        x:zero+"%", 
                        width:width(d.opp + d.oth)+"%",
                        fill:"#777777"
                        }
                    ]
            });

            seg.exit().remove();
            seg.enter().append("rect").merge(seg)
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

                    //labels
            var labels_ = groups.selectAll("text").data(function(d){return [{name: occ_names[d.occ], occ:d.occ}]});
            labels_.enter().append("text").merge(labels_).attr("x",zero+"%").attr("y", 0)
                .attr("text-anchor","end")
                .attr("dx","-4")
                .text(function(d){
                    var txt = d.name.replace(/\s*Occupations\s*$/i, "");
                    return labeler(txt, nchar)
                })
                .style("font-size","14px")
                .attr("dy", bar_height-4)
                .style("font-weight",function(d){
                    return d.occ == this_occ ? "bold" : "normal";
                });

            g_right_axis_label.text("Share of " + labeler(occ_names[this_occ].replace(/\s*Occupations*\s$/i, ""), 40));
            right_header_title.text("Over a ten-year period, this where job-holders in " + 
                                    occ_names[this_occ].toLowerCase() + 
                                    " ended up").style("visibility","visible"); 
            
        })


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

    window.addEventListener("resize", function(){
        update_();
    })

    return update_;


    //return fetch_and_update;
}