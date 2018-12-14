import dir from "../../../js-modules/rackspace.js";

import {occ_flows, occ_shares, occ_names} from "./occupation-data.js";

//to do: fallback for browsers without support for promises .. consider alt graphics or adding polyfills (https://github.com/github/fetch)

export default function flow_diagram(container){
    //one time setup
    var wrap = d3.select(container).style("overflow","visible");

    var bar_height = 10;
    var text_height = 17;
    var bar_pad = 30;

    var header = wrap.append("div").style("display","table").style("width","100%")
                     

    var headers1 = header.append("div").style("display","table-row")
                        .selectAll("div").data([0,1,2]).enter().append("div")
                        .style("display","table-cell")
                        .style("vertical-align","top")
                        .style("width","33%").style("padding-right","48px");
    var headers2 = header.append("div").style("display","table-row")
                        .selectAll("div").data([0,1,2]).enter().append("div")
                        .style("display","table-cell")
                        .style("vertical-align","bottom")
                        .style("width","33%").style("padding-right","48px");

    headers1.each(function(d,i){
        var thiz = d3.select(this);
        if(i==0){
            thiz.html('<p><em>Different occupations provide different levels of opportunity</em></p>')
        }
        else if(i==1){
            thiz.html('<p><em>Workers switch occupations a lot, and which occupation they switch to affects their likelihood of landing a good job</em></p>')
        }
        else if(i==2){
            thiz.html('<p><em>Click on an occupation to see which occupations job-holders switched to, or what portion stayed in the same occupation.</p>')
        }
    })

    headers2.each(function(d,i){
        var thiz = d3.select(this);
        if(i==0){
            thiz.html('<p style="margin:0px;font-size:14px;font-weight:bold;"><span class="key-swatch promising-jobs">Good and promising jobs</span><br /><br />Share of all metro area jobs</p>')
        }
        else if(i==1){
            thiz.html('<p style="margin:0px;font-size:14px;font-weight:bold;"><span class="key-swatch hi-jobs">Portion who switched from this occupation over a 10-year period</span><br /><br/>Share of all metro area jobs</p>')
        }
        else if(i==2){
            thiz.html('<p style="margin:0px;font-size:14px;font-weight:bold;">Share of jobs from selected occupation</p>')
        }
    })

    var svg = wrap.append("svg").attr("width","100%").attr("height",((bar_height+bar_pad)*22)+bar_pad);

    var zero_left = 0;
    var zero_middle = 33;
    var zero_right = 66;
    var pct_width = 25;

    var g_left = svg.append("g");
    var g_left_anno = g_left.append("g");
    var g_left_axis = g_left_anno.append("line").attr("y1",30).attr("y2",30)
                                                .attr("x1",zero_left+"%").attr("x2",(zero_left+pct_width)+"%")
                                                .attr("stroke","#aaaaaa");
    
    var g_middle = svg.append("g");
    var g_middle_anno = g_middle.append("g");
    var g_middle_axis = g_middle_anno.append("line").attr("y1",30).attr("y2",30)
                                        .attr("x1",zero_middle+"%").attr("x2",(zero_middle+pct_width)+"%")
                                        .attr("stroke","#aaaaaa");

    var g_right = svg.append("g");//.style("visibility","hidden").style("opacity","0");
    var g_right_anno = g_right.append("g");
    var g_right_axis = g_right_anno.append("line").attr("y1",30).attr("y2",30)
                                    .attr("x1",zero_right+"%").attr("x2",(zero_right+pct_width)+"%")
                                    .attr("stroke","#aaaaaa");

    var sub_ba = false;


    function add_ticks(g, scale){
        var ticks = scale.ticks(4);

        var lines = g.selectAll("line.tick-mark").data(ticks);
        lines.exit().remove();
        lines.enter().append("line").classed("tick-mark",true).style("opacity","0").merge(lines)
            .attr("y1", 25).attr("y2", 30)
            .attr("stroke","#aaaaaa")
            .transition().duration(1200)
            .attr("x1", function(d){return scale(d)+"%"})
            .attr("x2", function(d){return scale(d)+"%"})
            .style("opacity",1)
            ;

        var text = g.selectAll("text.tick-mark").data(ticks);
        text.exit().remove();
        text.enter().append("text").classed("tick-mark",true).style("opacity","0").merge(text)
            .attr("y", 23)
            .text(function(d){return (d*100) + "%"})
            .style("font-size","14px")
            .attr("dx","0")
            .attr("text-anchor", function(d){return d==0 ? "start" : "middle"})
            .transition().duration(1200)
            .attr("x", function(d){return scale(d)+"%"})
            .style("opacity",1)
            ;
    }



    //var x_left = d3.scaleLinear().domain([0, 1]).range([zero_left, zero_left-pct_width]).nice();
    var x_left = d3.scaleLinear().domain([0, 1]).range([zero_left, zero_left+pct_width]).nice();
    var x_middle = d3.scaleLinear().domain([0, 1]).range([zero_middle, zero_middle+pct_width]).nice();
    var x_right = d3.scaleLinear().domain([0, 0.25]).range([zero_right, zero_right+pct_width]).nice();

    //TO DO: update x_right and ticks based on data!!!

    add_ticks(g_right_anno, x_right);

    //var width_left = function(v){return zero_left - x_left(v);}
    var width_left = function(v){return x_left(v) - zero_left;}
    var width_middle = function(v){return x_middle(v) - zero_middle;}
    var width_right = function(v){return x_right(v) - zero_right;}

    var left_fill = {opp:"#52d0a8", hi:"#ffa200", oth:"#aaaaaa"}
    var middle_fill = {switch:"#ffa200", stay:"#aaaaaa"}

    function update_(cbsa){
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

        console.log(flow);

        x_left.domain([0, max_share]).nice();
        x_middle.domain([0, max_share]).nice();


        add_ticks(g_left_anno, x_left);
        add_ticks(g_middle_anno, x_middle);
        //to do -- single set of groups?

        //left
        var left_groups_ = g_left.selectAll("g.g_bar").data(shares, function(d){return d.occ});
        left_groups_.exit().remove()
        var left_groups = left_groups_.enter().append("g").classed("g_bar",true).merge(left_groups_);

        left_groups.transition().duration(900).attr("transform", function(d,i){
            return "translate(0," + (i*(bar_height + bar_pad) + bar_pad) + ")";
        })
        
        var segments = left_groups.selectAll("rect").data(function(d){
            return [{id:"opp", 
                     val:d.opp, 
                     x:zero_left+"%", 
                     width:width_left(d.opp)+"%",
                     fill:left_fill.opp
                    },
                    {id:"oth", 
                     val:d.oth, 
                     x:(zero_left + width_left(d.opp))+"%", 
                     width:width_left(d.oth)+"%",
                     fill:left_fill.oth
                    }
                ]
        });

        segments.exit().remove();
        segments.enter().append("rect").merge(segments)
                .attr("height", bar_height)
                .attr("y","0")
                .attr("fill", function(d){return d.fill})
                .attr("y", 8)
                .transition()
                .duration(1200)
                .delay(0)
                .attr("x", function(d){return d.x})
                .attr("width", function(d){return d.width})
                ;

        //middle
        var middle_groups_ = g_middle.selectAll("g.g_bar").data(shares, function(d){return d.occ});
        middle_groups_.exit().remove()
        var middle_groups = middle_groups_.enter().append("g").classed("g_bar",true).merge(middle_groups_).style("cursor","pointer");

        middle_groups.transition().duration(900).attr("transform", function(d,i){
            return "translate(0," + (i*(bar_height + bar_pad) + bar_pad) + ")";
        })
        
        var segments2_ = middle_groups.selectAll("rect").data(function(d){
            
            var occ = d.occ + "";
            var f = flow[occ].filter(function(o){return (o.occ+"") == occ})[0];
            var sh = f.opp + f.oth;
            var tot = d.opp + d.oth;
            var leave = (1-sh)*tot;
            var stay = sh*tot;

            return [{id:"switch", 
                     val:leave, 
                     x:zero_middle+"%", 
                     width:width_middle(leave)+"%",
                     fill:middle_fill.switch,
                     occ:occ
                    },
                    {id:"stay", 
                     val:stay, 
                     x:zero_middle + width_middle(leave)+"%", 
                     width:width_middle(stay)+"%",
                     fill:middle_fill.stay,
                     occ:occ
                    }
                ]
        });

        segments2_.exit().remove();
        var segments2 = segments2_.enter().append("rect").merge(segments2_)
                .attr("height", bar_height)
                .attr("y","0")
                .attr("fill", function(d){return d.fill})
                .attr("y", 8)
        
                segments2.transition()
                .duration(1200)
                .delay(0)
                .attr("x", function(d){return d.x})
                .attr("width", function(d){return d.width})
                ;

        var dividers = middle_groups.selectAll("line").data([1]);
        dividers.enter().append("line").merge(dividers).attr("x1",zero_left+"%").attr("x2", (100) + "%")
            .attr("y1", bar_height+bar_pad).attr("y2", bar_height+bar_pad).attr("stroke","#dddddd").style("shape-rendering","crispEdges");
            ;

        //labels
        var labels = middle_groups.selectAll("text").data(function(d){return [occ_names[d.occ]]});
        labels.enter().append("text").merge(labels).attr("x",zero_left+"%").attr("y", bar_height+6)
            .attr("text-anchor","start").text(function(d){return d}).style("font-size","14px").style("font-weight","bold")
            .attr("dy",text_height)
            ;

        middle_groups.on("mousedown", function(d){
            //right
            var this_occ = d.occ;

            segments2.attr("stroke",function(d){
                return d.occ == this_occ ? "#111111" : null;
            })

            var these_shares = flow[d.occ];

            var groups_ = g_right.selectAll("g.g_bar").data(these_shares, function(d){return d.occ});
            groups_.exit().remove()
            var groups = groups_.enter().append("g").classed("g_bar",true).merge(groups_);

            groups.transition().duration(900).attr("transform", function(d,i){
                return "translate(0," + (i*(bar_height + bar_pad) + bar_pad) + ")";
            })
            
            var segments = groups.selectAll("rect").data(function(d){
                
                var occ = d.occ + "";

                return [{id:"share", 
                        val:null, 
                        x:zero_right+"%", 
                        width:width_right(d.opp + d.oth)+"%",
                        fill:"#777777"
                        }
                    ]
            });

            segments.exit().remove();
            segments.enter().append("rect").merge(segments)
                    .attr("height", bar_height)
                    .attr("y","0")
                    .attr("fill", function(d){return d.fill})
                    .attr("y", 8)
                    .transition()
                    .duration(1200)
                    .delay(0)
                    .attr("x", function(d){return d.x})
                    .attr("width", function(d){return d.width})
                    ;

        })


    }


    return update_;

    //update function called by fetch_and_update
    function update(d){
        var flow;
 
    }


    ///CACHING AND DATA RETRIEVAL BELOW

    //data cache
        var cache = {}

    //keep track of latest geo selected -- avoid callback confusion!
        var latest_geo = null;

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

    return fetch_and_update;
}