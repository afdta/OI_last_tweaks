import {cbsas, industry_names} from './industry-data.js';
import {occ_names} from "./occupation-data.js";

//cbsas should look like: [{code:10420, name:"Akron ..."}, {code:___, name:___}, ...]
function add_select(container, opt_data, callback, prompt){
    var wrap = d3.select(container).classed("c-fix",true);

    var outer_select_wrap = wrap.append("div").style("float","left").classed("c-fix",true);

    if(arguments.length > 3){
        outer_select_wrap.append("p").html("<em>" + prompt + "</em>").style("margin","0px 5px 5px 0px").style("font-size","15px");
    }

    var select_wrap = outer_select_wrap.append("div").classed("select-wrap",true);

    var title = wrap.append("p").classed("mi-title2",true)
        .style("margin","0px 0px 0px 0px")
        .style("float","none")
        .style("display","inline-block")
        .style("vertical-align","bottom");
    
    select_wrap.append("svg").attr("width","20px").attr("height","20px").style("position","absolute").style("top","45%").style("right","0px")
                .append("path").attr("d", "M0,0 L5,5 L10,0").attr("fill","none").attr("stroke", "#aaaaaa").attr("stroke-width","2px");

    var select = select_wrap.append("select");
    var select_node = select.node();

    //select.append("option").text(prompt).attr("disabled","yes").attr("selected","1").attr("hidden","1");

    var options = select.selectAll("option.cbsa-option")
                        .data(opt_data.slice(0).sort(function(a,b){return d3.ascending(a.name, b.name)} ))
                        .enter().append("option").classed("cbsa-option",true)
                        .text(function(d){return d.name})
                        .attr("value", function(d){return d.code+""})
                        ;  
                        
    //call callback with code as only arg
    function update_(v){
        //run callback
        if(typeof callback === "function"){
            callback(v);
        }
    }

    //programatically update select value, run update_
    function update(v){
        select_node.value = v;
        update_(v);
    } 
    
    select.on("change", function(){
        var v = this.value + "";
        update_(v);
    });

    return {update: update, refresh:function(v){select_node.value = v}};
}

function metro_select(container, callback){
    return add_select(container, cbsas, callback, "Select a metropolitan area");
}

function occ_select(container, callback){
    var occs = [];
    for(var o in occ_names){
        if(occ_names.hasOwnProperty(o)){
            occs.push({code:o, name:occ_names[o]})
        }
    }
    return add_select(container, occs, callback, "Select starting occupation");
}

function edu_select(container, callback){
    var edus = [{code:"Sub", name:"Workers without a bachelor's degree"}, {code:"BA", name:"Workers with a bachelor's degree"}];
    return add_select(container, edus, callback, "Select worker education level");
}

var lookup = {};
cbsas.forEach(function(d){
    lookup[d.code] = d.name;
});

export {metro_select, occ_select, edu_select, lookup};
