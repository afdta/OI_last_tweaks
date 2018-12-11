import {industry_data, industry_names, cbsas} from './industry-data.js';
import small_map from "./small-map.js";

export default function metros_chart(container, scope){
    
    var wrap = d3.select(container).append("div");

    var lookup = {};
    cbsas.forEach(function(d){
        lookup[d.code] = d.name;
    });

    var header = wrap.append("div").classed("c-fix",true).style("margin","0px 0px 15px 0px");
    var title = header.append("p").classed("mi-title2",true);


    var metros_data = cbsas.map(function(cbsa){
        var obs = industry_data[cbsa.code].filter(function(d){return d.naics===null});
        return obs[0];
    })

    //metros_data.sort(function(a,b){return d3.descending(a.obs.g+a.obs.p, b.obs.g+b.obs.p)})

    var segment_labels = {g:"Good", p:"Promising", hi:"High-skilled", o:"Other"}
    var segment_fill = {g:"#394d9c", p:"#52d0a8", hi:"#ffa200", o:"#777777"}

    var wraps = wrap.selectAll("div.metro-bar-wrap").data(["g","p","hi","o"]).enter().append("div").classed("metro-bar-wrap",true).style("width","100%");
    var titles = wraps.append("p").classed("mi-title3",true).text(function(d){return segment_labels[d]});
    var svgs = wraps.append("svg").attr("height","200px").attr("width","100%");

    svgs.each(function(cat,i){
        var data = metros_data.sort(function(a,b){return d3.descending(a[cat], b[cat])})
        var svg = d3.select(this);
        var x = d3.scaleLinear().domain([0,99]).range([0,99]);
        var y = d3.scaleLinear().domain([0,d3.max(data, function(d){return d[cat]})]).range([100,10]);
        var height = function(v){return 100 - y(v)}
        
        var bars = svg.selectAll("rect").data(data).enter().append("rect")
                    .attr("x", function(d,i){return i + "%"})
                    .attr("y", function(d,i){return y(d[cat])})
                    .attr("width","1%")
                    .attr("height", function(d,i){return height(d[cat])})
                    .attr("stroke","#ffffff")
                    .attr("fill", segment_fill[cat])
                    .style("shape-rendering","crispEdges")
                    ;
    })

    console.log(metros_data);

    function update(cbsa){

    }

    return update;

    var x = d3.scaleLinear().domain([0,1]).range([0,100]);

    var width = function(v){
        if(v==null){
            return 0;
        }
        else{
            return x(v) - x(0);
        }
    }



    function layout(g, cbsa){
        var s = ["g", "p", "hi", "o"];
        
        var xcum = x(0);
        var o = [];
        s.forEach(function(d,i){
            var v = g[d];
            var w = width(v);
            o.push({x:xcum, width:w, value:v, label:segment_labels[d], fill:segment_fill[d]});
            xcum = xcum + w;
        });

        return {segments:o, name:cbsa.name, obs:g};
    }

    var bar_height = 15;
    var bar_pad = 25;


    var metros_data = cbsas.map(function(cbsa){
        var obs = industry_data[cbsa.code].filter(function(d){return d.naics===null})
        console.log(obs.length);
        return layout(obs[0], cbsa);
    })

    metros_data.sort(function(a,b){return d3.descending(a.obs.g+a.obs.p, b.obs.g+b.obs.p)})

    //update function to be passed to metro select
    function update(){
        //small multiples
        var bar_pad2 = 3;
        var bar_height2 = 12;
        var multiples_ = small_multiples.selectAll("div").data(metros_data, function(d,i){return d.industry});
            multiples_.exit().remove();
        var multiples_enter = multiples_.enter().append("div");
            multiples_enter.append("svg").attr("width","100%").attr("height", (4*bar_height2) + (5*bar_pad2));
            multiples_enter.append("p").style("font-size","14px").style("font-weight","normal").style("line-height","1.3em");
            
        var multiples = multiples_enter.merge(multiples_).order();

        var bars = multiples.select("svg").selectAll("rect").data(function(d){return d.segments}, function(d){return d.label});
        bars.exit().remove();
        bars.enter().append("rect").merge(bars)
            .attr("y", function(d,i){return bar_pad2 + (i*(bar_height2+bar_pad2))})
            
            .attr("fill", function(d){return d.fill})
            .attr("height", bar_height2)
            .transition()
            .attr("width", function(d,i){return d.width + "%"})
            .attr("x", x(0)+"%")
            ;

        var labels = multiples.select("svg").selectAll("text").data(function(d){return d.segments}, function(d){return d.label});
        labels.exit().remove();
        labels.enter().append("text").merge(labels)
            .attr("y", function(d,i){return bar_pad2 + (i*(bar_height2+bar_pad2))})
            .style("font-size","13px")
            .attr("dy","10")
            .attr("dx","2")
            .text(function(d){return Math.round(d.value*1000)/10 + "%"})
            .transition()
            .attr("x", function(d){return (x(0) + d.width) + "%"})
            ;

        multiples.select("p").text(function(d){return d.name}).style("margin","0px");
    }

    update();

    return update;    
}