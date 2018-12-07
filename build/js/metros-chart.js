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

    //chart wrap
    var small_multiples_wrap = wrap.append("div").style("border-top","0px solid #aaaaaa").style("margin","0px 0px").style("padding","0px 0px");
    small_multiples_wrap.append("p").html("Option 1: same as industry chart above OR Option 2: small multiples (below); could stack bars to save space, or just stack good + promising + hi? <br/>Drop 'Other'?")
    small_multiples_wrap.append("p").html('Percentage of jobs in each metro area that are ' +
                                     '<span class="key-swatch good-jobs">good jobs</span>, ' + 
                                     '<span class="key-swatch promising-jobs">promising jobs</span>, ' +
                                     '<span class="key-swatch hi-jobs">high-skill jobs</span>, '+
                                     'or <span class="key-swatch other-jobs">other jobs</span>')
                                     .style("font-weight","bold").style("line-height","1.7em");

    var small_multiples = small_multiples_wrap.append("div").classed("small-multiples",true);



    var x = d3.scaleLinear().domain([0,1]).range([0,100]);

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