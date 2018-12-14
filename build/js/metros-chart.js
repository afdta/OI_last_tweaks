import {industry_data, industry_names, cbsas} from './industry-data.js';
import small_map from "./small-map.js";
import labeler from "./labeler.js";
import {metro_select} from "./select-factory.js";

export default function metros_chart(container, scope){
    
    var wrap = d3.select(container).append("div");

    var lookup = {};
    cbsas.forEach(function(d){
        lookup[d.code] = d.name;
    });

    var segment_labels = {g:"Good jobs held by workers without college degrees", 
                          p:"Promising jobs held by workers without college degrees", 
                          hi:"Good and promising jobs held by workers with a college degree", 
                          o:"Other jobs"}
    var segment_fill = {g:"#394d9c", p:"#52d0a8", hi:"#ffa200", o:"#777777"}

    var axis_width = 40;
    var Ymin = 190.5;
    var Ymax = 30.5;
    var chartHeight = Ymin - Ymax + 60;
    var width = 3;
    var width2 = width/2;
    var Xmax = (width*100) - width;
    var X = d3.scaleLinear().domain([0,99]).range([axis_width, Xmax]);
    var Y = d3.scaleLinear().domain([0,0.8]).range([Ymin,Ymax]);
    var tick_vals = Y.ticks(6);

    var height = function(v){return Ymin - Y(v)}
    
    //data grouped by category, then sorted by value
    var metros_data = (["p", "g", "hi", "o"]).map(function(cat){
        var all = cbsas.map(function(cbsa){
            var obs = industry_data[cbsa.code].filter(function(d){return d.naics===null})[0];
            return {name: cbsa.name, cbsa:cbsa.code+"", val:obs[cat], cat:cat}
        });
        all.sort(function(a,b){return d3.ascending(a.val, b.val)});
        //max, rounded up to nearest 10%
        var max = Math.ceil(d3.max(all, function(d){return d.val}) * 10)/10;
        return {name: segment_labels[cat], cat:cat, obs: all, Ymax: Y(max), max:max };
    });


    var wraps = wrap.selectAll("div.metro-bar-wrap").data(metros_data)
                    .enter().append("div").classed("metro-bar-wrap",true).style("width","100%");
    
    var titles = wraps.append("p").classed("mi-title3",true).text(function(d){return d.name})
                        .style("margin","20px 0px 0px 0px")
                        .style("border-bottom","0px solid #dddddd").style("padding-bottom","0px");

    var svgs = wraps.append("svg").attr("height",function(d){return (chartHeight - d.Ymax + Ymax)}).attr("width","100%")
                    .append("g").attr("transform", function(d){return "translate(0,-" + (d.Ymax-Ymax) +")"});

    var axes = svgs.selectAll("line.y-axis").data(function(d){return [{"y1":Ymin, "y2": d.Ymax}]})
                .enter().append("line").classed("y-axis",true)
                .attr("y1",function(d){return d.y1})
                .attr("y2",function(d){return d.y2})
                .attr("x1",axis_width - 5.5)
                .attr("x2",axis_width - 5.5)
                .attr("stroke","#aaaaaa")
                ;

    var ticks = svgs.selectAll("line.y-tick").data(function(d){
        return tick_vals.filter(function(v){return v <= d.max});
    }).enter().append("line").classed("y-tick",true).attr("x1", axis_width - 10.5).attr("x2", axis_width - 5.5)
    .attr("y1", function(d){return Y(d)}).attr("y2", function(d){return Y(d)}).attr("stroke","#aaaaaa")
    .style("shape-rendering","crispEdges");

    var ticklabs = svgs.selectAll("text.y-tick").data(function(d){
        return tick_vals.filter(function(v){return v <= d.max});
    }).enter().append("text").classed("y-tick",true).attr("x", axis_width - 11.5).attr("text-anchor","end")
        .attr("y", function(d){return Y(d)})
        .attr("dy","4")
        .text(function(d){return Math.round(d*100)+"%"})
        .style("font-size","13px");


    var leaders = svgs.selectAll("line.leader-line").data(function(d){return d.obs}).enter().append("line").classed("leader-line",true)
    .attr("x1", function(d,i){return X(i)+Math.floor(width2)+0.5})
    .attr("x2", function(d,i){return X(i)+Math.floor(width2)+0.5})
    .attr("y1", function(d,i){return Y(d.val)-10})
    .attr("y2", Ymin + 10)
    .attr("stroke",function(d){return segment_fill[d.cat]})
    .attr("stroke-width",1)
    .style("shape-rendering","crispEdges")
    .style("visibility","hidden")
    ;

    var bars = svgs.selectAll("rect").data(function(d){return d.obs})
    .enter().append("rect")
    .attr("x", function(d,i){return X(i)})
    .attr("y", function(d,i){return Y(d.val)})
    .attr("width", width)
    .attr("height", function(d,i){return height(d.val)})
    .attr("stroke","#ffffff")
    .attr("fill", function(d){return segment_fill[d.cat]})
    .style("shape-rendering","crispEdges")
    ;

    var anno = svgs.selectAll("text.value-anno").data(function(d){return d.obs}).enter().append("text").classed("value-anno",true)
    .attr("x", function(d,i){
        var x = X(i);
        return i < 20 ? x : (i > 80 ? x+width : x+width2);
    })
    .attr("text-anchor",function(d,i){
        return i < 20 ? "start" : (i > 80 ? "end" : "middle");
    })
    .attr("y", function(d,i){return Y(d.val)})
    .text(function(d){
        return (Math.round(d.val*1000)/10)+"%";
    })
    .attr("dy","-12")
    .style("visibility","hidden")
    ;

    var anno2 = svgs.selectAll("text.name-anno").data(function(d){return d.obs}).enter().append("text").classed("name-anno",true)
    .attr("x", function(d,i){
        var x = X(i);
        return i < 20 ? x : (i > 80 ? x+width : x+width2);
    })
    .attr("text-anchor",function(d,i){
        return i < 40 ? "start" : (i > 60 ? "end" : "middle");
    })
    .attr("y", Ymin)
    .attr("dy", 23)
    .text(function(d){
        return d.name;
    })
    .style("visibility","hidden")
    ;

    function highlight(cbsa, duration){
        var c = cbsa + "";

        var dur = arguments.length < 2 ? 500 : duration;

        bars.style("opacity", function(d){return d.cbsa == c ? "1" : "0.5"});

        leaders.interrupt().style("opacity","0")
        .style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"})
        .transition().duration(dur).style("opacity",1)
        ;

        anno.interrupt().style("opacity","0")
        .style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"})
        .transition().duration(dur).style("opacity",1)
        ;

        anno2.interrupt().style("opacity","0")
        .style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"})
        .transition().duration(dur).style("opacity",1)
        ;
    }

    var pinned_cbsa = "";

    function update(cbsa){
        resize();
        highlight(cbsa, 0);
        pinned_cbsa = cbsa;
    }

    var leave_timer;

    bars.on("mouseenter", function(d){
        clearTimeout(leave_timer)
        highlight(d.cbsa);
    })

    bars.on("mouseleave", function(d){
        clearTimeout(leave_timer)
        leave_timer = setTimeout(function(){highlight(pinned_cbsa, 0);},250);
    })

    bars.on("touchstart", function(d){
        clearTimeout(leave_timer);
        highlight(d.cbsa);
        d3.event.stopPropagation();
        d3.event.preventDefault();
    })

    bars.on("touchend", function(d){
        clearTimeout(leave_timer)
        leave_timer = setTimeout(function(){highlight(pinned_cbsa, 0);},500);
        d3.event.stopPropagation();
        d3.event.preventDefault();
    })
    
    function resize(){
        try{
            var box = wrap.node().getBoundingClientRect();
            var w = box.right - box.left - 1;
            width = Math.floor((w - axis_width)/100);
            if(width < 2){
                throw new Error("Too narrow");
            }
        }
        catch(e){
            width = 2;
        }

        width2 = width/2;
        Xmax = (width*100) - width + axis_width;
        X.range([axis_width+0.5, Xmax+0.5]);

        bars.attr("x", function(d,i){return X(i)}).attr("width", width);

        leaders.attr("x1", function(d,i){return (X(i)+Math.round(width2))})
        .attr("x2", function(d,i){return (X(i)+Math.round(width2))});
        
        anno.attr("x", function(d,i){
            var x = X(i);
            return i < 20 ? x : (i > 80 ? x+width : x+width2);
        });

        anno2.attr("x", function(d,i){
            var x = X(i);
            return i < 20 ? x : (i > 80 ? x+width : x+width2);
        });

        var rough_px_per_char = 10;
        if(Xmax < 500){
            anno2.text(function(d){
                return labeler(d.name, ((Xmax/2)/rough_px_per_char));
            })
        }
        else{
            anno2.text(function(d){
                return d.name;
            })
        }
    }

    //initialize
    setTimeout(function(){
        update(scope.cbsa);

        metro_select(document.getElementById("metro-shares-select"), update);

        window.addEventListener("resize", resize);
    }, 0) 
    

    return update;
}