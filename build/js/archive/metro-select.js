//cbsas should look like: [{code:10420, name:"Akron ..."}, {code:___, name:___}, ...]
function add_select(container, options, callback){

}

function metro_select(container, callback){

}

export default function metro_select(cbsas){

    var num = -1;
    var queue = [];

    function register(container, callback){

        var wrap = d3.select(container).append("div").classed("c-fix",true);

        var select_wrap = wrap.append("div").classed("select-wrap",true).style("clear","both");
    
        var title = wrap.append("p").classed("mi-title2",true)
            .style("margin","0px 0px 0px 0px")
            .style("float","none")
            .style("display","inline-block")
            .style("vertical-align","bottom");
        
        select_wrap.append("svg").attr("width","20px").attr("height","20px").style("position","absolute").style("top","45%").style("right","0px")
                    .append("path").attr("d", "M0,0 L5,5 L10,0").attr("fill","none").attr("stroke", "#aaaaaa").attr("stroke-width","2px");
    
        var select = select_wrap.append("select");
        select.append("option").text("Select a metropolitan area").attr("disabled","yes").attr("selected","1").attr("hidden","1");
    
        var options = select.selectAll("option.cbsa-option")
                            .data(cbsas.slice(0).sort(function(a,b){return d3.ascending(a.name, b.name)} ))
                            .enter().append("option").classed("cbsa-option",true)
                            .text(function(d){return d.name})
                            .attr("value", function(d){return d.code+""})
                            ;    
        
        var id = ++num;

        //call callback with code as only arg
        function update_(v){
            //run callback
            if(typeof callback === "function"){
                callback(v);
            }
        }
    
        //programatically update select value, run update_
        function update(v){
            select.node().value = v;
            update_(v);
        } 
        
        select.on("change", function(){
            var v = this.value + "";
            update_(v);
            
            //update all others
            //var i = -1;
            //while(++i < queue.length){
            //    if(queue[i].id != id){
            //        queue[i].fn(v);
            //    }
            // }
        })
        
        queue.push({id:id, fn:update});
    
        return update;
    
    }

    return register;


}
