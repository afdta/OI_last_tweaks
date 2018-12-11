import {industry_data, industry_names, cbsas} from './industry-data.js';
import small_map from "./small-map.js";

export default function metros_chart(container, scope){
    
    var wrap = d3.select(container).append("div");

    var lookup = {};
    cbsas.forEach(function(d){
        lookup[d.code] = d.name;
    });

    var header = wrap.append("div").classed("c-fix",true).style("margin","0px 0px 15px 0px");
    var map_wrap = header.append("div").style("float","left");
    var update_map = small_map(map_wrap.node());
    var title = header.append("p").classed("mi-title2",true).text("Metro area name");
    var subtitle = header.append("p").html("<em>Need to describe catgories (e.g. what is high-skilled)? Add axes, value annotations.</em>").style("clear","both");


    var metros_data = cbsas.map(function(cbsa){
        var obs = industry_data[cbsa.code].filter(function(d){return d.naics===null})[0];
        var r = {name: cbsa.name, cbsa:cbsa.code+"", g:obs.g, p:obs.p, hi:obs.hi, o:obs.o}

        return r;
    })

    //metros_data.sort(function(a,b){return d3.descending(a.obs.g+a.obs.p, b.obs.g+b.obs.p)})

    var segment_labels = {g:"Good", p:"Promising", hi:"High-skilled", o:"Other"}
    var segment_fill = {g:"#394d9c", p:"#52d0a8", hi:"#ffa200", o:"#777777"}

    var wraps = wrap.selectAll("div.metro-bar-wrap").data(["g","p","hi","o"]).enter().append("div").classed("metro-bar-wrap",true).style("width","100%");
    var titles = wraps.append("p").classed("mi-title3",true).text(function(d){return segment_labels[d]});
    var svgs = wraps.append("svg").attr("height","160px").attr("width","100%");

    var updaters = [];

    svgs.each(function(cat,i){
        var data = metros_data.sort(function(a,b){return d3.descending(a[cat], b[cat])})
        var svg = d3.select(this);
        var x = d3.scaleLinear().domain([0,99]).range([0,99]);
        var ymin = 120;
        var ymax = 20;
        var y = d3.scaleLinear().domain([0,d3.max(data, function(d){return d[cat]})]).range([ymin,ymax]);
        var height = function(v){return ymin - y(v)}
        
        var leaders = svg.selectAll("line").data(data).enter().append("line")
                    .attr("x1", function(d,i){return (x(i)+0.5) + "%"})
                    .attr("x2", function(d,i){return (x(i)+0.5) + "%"})
                    .attr("y1", function(d,i){return y(d[cat])-10})
                    .attr("y2", ymin + 10)
                    .attr("stroke",function(d){return segment_fill[cat]})
                    .attr("stroke-width",1)
                    .style("shape-rendering","crispEdges")
                    .style("visibility","hidden")
                    ;

        var bars = svg.selectAll("rect").data(data).enter().append("rect")
                    .attr("x", function(d,i){return x(i) + "%"})
                    .attr("y", function(d,i){return y(d[cat])})
                    .attr("width", "1%")
                    .attr("height", function(d,i){return height(d[cat])})
                    .attr("stroke","#ffffff")
                    .attr("fill", segment_fill[cat])
                    .style("shape-rendering","crispEdges")
                    ;

        var anno = svg.selectAll("text.value-anno").data(data).enter().append("text").classed("value-anno",true)
                    .attr("x", function(d,i){
                        return i < 20 ? (i+"%") : (i > 80 ? (i+1)+"%" : (i+0.5)+"%");
                    })
                    .attr("text-anchor",function(d,i){
                        return i < 20 ? "start" : (i > 80 ? "end" : "middle");
                    })
                    .attr("y", function(d,i){return y(d[cat])})
                    .text(function(d){
                        return (Math.round(d[cat]*1000)/10)+"%";
                    })
                    .attr("dy","-12")
                    .style("visibility","hidden")
                    ;

        var anno2 = svg.selectAll("text.name-anno").data(data).enter().append("text").classed("name-anno",true)
                    .attr("x", function(d,i){
                        return i < 40 ? (i+"%") : (i > 60 ? (i+1)+"%" : (i+0.5)+"%");
                    })
                    .attr("text-anchor",function(d,i){
                        return i < 40 ? "start" : (i > 60 ? "end" : "middle");
                    })
                    .attr("y", ymin)
                    .attr("dy", 23)
                    .text(function(d){
                        return d.name;
                    })
                    .style("visibility","hidden")
                    ;

                    
        function u(cbsa){

            console.log(cbsa);
            var c = cbsa + "";
            leaders.style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"});
            anno.style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"});
            anno2.style("visibility", function(d){return d.cbsa == c ? "visible" : "hidden"});
            bars.style("opacity", function(d){return d.cbsa == c ? "1" : "0.5"});
        }

        updaters.push(u);

    });

    console.log(metros_data);

    function update(cbsa){
        update_map(cbsa);

        title.text(lookup[cbsa]);

        updaters.forEach(function(fn){
            fn(cbsa);
        });
    }

    return update;
}