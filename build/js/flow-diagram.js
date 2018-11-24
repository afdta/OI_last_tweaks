import dir from "../../../js-modules/rackspace.js";
import start_occs from "./start-occs.js";

//to do: fallback for browsers without support for promises .. consider alt graphics or adding polyfills (https://github.com/github/fetch)

export default function flow_diagram(container, width){
    //one-time setup
    var wrap = d3.select(container);

    //default width
    if(arguments.length < 2){
        width = 1000;
    }

    var height = 600;
    var max_y = height*0.1;
    var min_y = height*0.9;

    var svg = wrap.append("svg").attr("width",width+"px").attr("height",height+"px");
    var g_left = svg.append("g");
    var g_left_axis = g_left.append("g");
    g_left_axis.append("line").classed("axis-line",true).attr("y1",min_y).attr("y2",max_y).attr("x1","25%").attr("x2","25%").attr("stroke","#aaaaaa");

    var g_right = svg.append("g");
    var g_right_axis = g_right.append("g");
    g_right_axis.append("line").classed("axis-line",true).attr("y1",min_y).attr("y2",max_y).attr("x1","75%").attr("x2","75%").attr("stroke","#aaaaaa");

    //data cache
    var cache = {}

    //keep track of latest geo selected -- avoid callback confusion!
    var latest_geo = null;

    var tipdisabled = true;

    function update(geo, data){
        var start_data = occs.map(function(d){

        });

        var yscale = d3.scaleLinear().domain().range([min_y, max_y]);

        var node_data

        var nodes = data.map(function(e){
            var val = e[indicator];
            var fixed = yscale(val);
            return {x:25, fy:fixed, fixed:fixed, occ:"here"};
        })
        ;

        //var ranker = format.ranker(nodes.map(function(d){return d.val}), indicator=="rank");

        var sim = d3.forceSimulation().nodes(nodes)
                         .force("corral", function force(alpha) {
                             var i = -1;
                             var node;
                             while(++i < nodes.length){
                                 node = nodes[i];
                                 if(node.x + node.vx > 50){node.x = 50 - node.vx}
                                 else if(node.x + node.vx < 0){node.x = 0 - node.vx}
                             }
                         })
                         .force("collide", d3.forceCollide(3))
                         .force("center", d3.forceX(25).strength(0.25))
                         .stop()
                         ;  

        //run through simulation                         
        var ii = -1;
        while(++ii < 300){
            sim.tick();
        }

        var circles = g_left.selectAll("circle").data(nodes);
        circles.exit().remove();
        
        var merged = circles.enter().append("circle").attr("r","3.5")
            .attr("fill-opacity","0.65")
            .attr("stroke","#ffffff")
            .attr("stroke-width","0.5")
            .merge(circles)
            .attr("fill",function(d,i){return "#0575B1"})
            .attr("visibility", function(d,i){return "visible"})
            ;


        merged.transition().duration(1500)
            .attr("cy", function(d){return d.fixed})
            .attr("cx", function(d){return d.x + "%"})
            .on("start", function(d,i){
                if(i==0){tipdisabled = true}
            })
            .on("end", function(d,i){
                if(i==merged.size){tipdisabled = false}
            })
            ;
    }

    //fetch, then update
    function fetch_and_update(geo, width){
        //record this request as the lates geo
        latest_geo = geo;

        //1) look in cache for data, if not there 2) fetch, store in cache, then update
        if(cache.hasOwnProperty(geo)){
            var data = cache[geo];
            //synchronous update
            update(geo, data);
        }
        else{
            var url = dir.url("data", "msp.json");
            d3.json(url).then(function(data){
                //store data in cache
                cache[geo] = data;
                //if no subsequent requests have overridden this one, update with this geo and data
                if(geo == latest_geo){
                    update(geo, cache[geo]);
                }
            });
        }

    }

    return fetch_and_update;
}