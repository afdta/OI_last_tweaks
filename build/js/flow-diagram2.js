import dir from "../../../js-modules/rackspace.js";

//to do: fallback for browsers without support for promises .. consider alt graphics or adding polyfills (https://github.com/github/fetch)

export default function flow_diagram(container, width){

    //default width
    if(arguments.length < 2){
        width = 1000;
    }

    var height = 500;
    var max_y = height*0.05;
    var min_y = height*0.95;

    //one-time dom setup
    var wrap = d3.select(container).style("width",width+"px").style("margin","1rem auto");

    var header = wrap.append("div").classed("c-fix",true).style("display","table").style("width","100%").style("border-spacing","15px")
                    .append("div").style("display","table-row");
    var left_header = header.append("div").style("width","50%").style("display","table-cell").style("border-bottom","1px solid #aaaaaa");
    var right_header = header.append("div").style("width","50%").style("display","table-cell").style("border-bottom","1px solid #aaaaaa");

    left_header.append("h3").text("Workers started in one of 94 occupations").style("margin","5px");
    left_header.append("p").html("<em>Click on a dot to see where they ended up, 10 years later</em>").style("margin","5px").style("color","#aa0000");
    left_header.append("p").html("<em>Dot size corresponds to share of ALL jobs</em>").style("margin","5px")
    left_header.append("p").html("<em>We could use dot color to indicate occupations that meet a threshold of good, promising, or other jobs (e.g. good over x% = green, promising over y% = yellow, otherwise red).</em>").style("margin","5px")
    
    right_header.append("h3").text("This is where workers in the selected occupation ended up").style("margin","5px");
    right_header.append("p").html("<em>Dot size corresponds to share of THIS occupation</em>").style("margin","5px");
    right_header.append("p").html("<em>In final form, we might choose to annotate some of these. Otherwise, the user could hover over dots to get information on the occupation and its flow.</em>").style("margin","5px")

    var svg = wrap.append("svg").attr("width","100%").attr("height",height+"px");

    var g_flow = svg.append("g");

    var g_left = svg.append("g");
    var g_left_axis = g_left.append("g");
    var left_axis = g_left_axis.append("line").classed("axis-line",true).attr("y1",min_y).attr("y2",max_y).attr("x1","25%").attr("x2","25%").attr("stroke","#aaaaaa");

    var g_right = svg.append("g");
    var g_right_axis = g_right.append("g");
    var right_axis = g_right_axis.append("line").classed("axis-line",true).attr("y1",min_y).attr("y2",max_y).attr("x1","75%").attr("x2","75%").attr("stroke","#aaaaaa");

    

    var tipdisabled = true;

    //DRAWING OF GRAPHIC

    function decorator(fn, prop){
        var accessor;

        if(typeof prop === "function"){
            //reassign
            accessor = prop;
        }
        else if(prop == null){
            //prop is undefined -- use identity
            accessor = function(v){return v};
        }
        else{
            //prop is a key
            accessor = function(v){return v[prop]};
        }

        return function(d){
            var v = accessor(d);
            return fn(v);
        }
    }

    //create a force layout
    var sim = function(node_data, fx, yscale, rscale){

        var nodes = node_data.map(function(d){
            var y = yscale(d);
            var r = rscale(d);
            return {x:fx, y:y, fy:y, r:r, data:d};
        })

        //console.log(JSON.stringify(nodes));

        var sim = d3.forceSimulation().nodes(nodes)
                .force("collide", d3.forceCollide().radius(function(d){return d.r+1}).strength(2))
                .force("horizontal", d3.forceX(fx).strength(1))
                .force("corral", function force(alpha) {
                    var i = -1;
                    var node;
                    while(++i < nodes.length){
                        node = nodes[i];
                        if(node.x + node.vx > fx*1.5){node.x = fx*1.45}
                        else if(node.x + node.vx < fx*0.5){node.x = fx*0.45}
                    }
                })

                .stop()
                ;  


        //run through simulation                         
        var j = -1;
        while(++j < 300){
            sim.tick();
        }

        nodes.sort(function(a, b){return d3.ascending(a.r, b.r)});

        return nodes;
    }


    function update(geo, data){

        var center = Math.round(width*0.25)+0.5;
        left_axis.attr("x1",center).attr("x2",center);
        right_axis.attr("x1",center).attr("x2",center);
        g_right.attr("transform","translate(" + (center*2) + ",0)");

        //single wage scale
        var wage_max = d3.max(data.summary.map(function(d){return Math.max(d.swage, d.ewage)}));
        var wage_min = d3.min(data.summary.map(function(d){return Math.min(d.swage, d.ewage)}));
        var wage_extent = [wage_min, wage_max];
        var yscale = d3.scaleLinear().domain([wage_extent[0],110000]).range([min_y, max_y]);

        //end wage lookup
        var end_wage_lookup = {};
        data.summary.forEach(function(d){
            end_wage_lookup[d.occ] = d.ewage;
        });

        //left panel - start
        var share_of_tot_extent = d3.extent(data.summary.map(function(d){return d.shtot}));
        var rscale = d3.scaleSqrt().domain([0, share_of_tot_extent[1]]).range([0,15]);
        //console.log(share_of_tot_extent);
        var nodes = sim(data.summary, center, decorator(yscale, "swage"), decorator(rscale, "shtot"));

        var circles = g_left.selectAll("circle").data(nodes);
        circles.exit().remove();
        
        var merged = circles.enter().append("circle")
            .attr("fill-opacity","0.65")
            .attr("stroke","#ffffff")
            .attr("stroke-width","0.5")
            .merge(circles)
            .attr("r",function(d){return d.r})
            .attr("fill",function(d,i){return "#0575B1"})
            .attr("visibility", function(d,i){return "visible"})
            ;


        merged.transition().duration(0)
            .attr("cy", function(d){return d.fy})
            .attr("cx", function(d){return d.x})
            .on("start", function(d,i){
                if(i==0){tipdisabled = true}
            })
            .on("end", function(d,i){
                if(i==merged.size()){tipdisabled = false}
            })
            ;

        //create a map of flows -- need to reimplement for older browsers
        //var map = d3.rollup(data.flows, function(d){return d.occ_a});
        var map = d3.nest().key(function(d){return d.occ_a}).object(data.flows);        

        merged.on("mousedown", function(d){

            var occ = d.data.occ;
            
            if(map.hasOwnProperty("a" + occ)){
                var flows = map["a"+occ];
                var max = d3.max(flows, function(d){return d.opportunity+d.other});
                var rscale = d3.scaleSqrt().domain([0,share_of_tot_extent[1]]).range([0,15]);

                //console.log(max);

                var thiz = d3.select(this);
                var startX = thiz.attr("cx");
                var startY = thiz.attr("cy");

                var end_wage_accessor = function(d){
                    var occ = d.occ_b.replace("b","");
                    return end_wage_lookup.hasOwnProperty(occ) ? end_wage_lookup[occ] : null;
                }

                var share_accessor = function(d){
                    return d.opportunity + d.other;
                }
                
                var nodes = sim(flows, center, decorator(yscale, end_wage_accessor), decorator(rscale, share_accessor));

                var total_shots = 3000;

                var circles = g_right.selectAll("circle").data(nodes);
                circles.exit().remove();
                
                var merged = circles.enter().append("circle")
                    .attr("fill-opacity","0.65")
                    .attr("stroke","#ffffff")
                    .attr("stroke-width","0.5")
                    .merge(circles)
                    .attr("fill",function(d,i){return "#0575B1"})
                    .attr("visibility", function(d,i){return "visible"})
                    .attr("r","1")
                    .attr("cy", function(d){return d.fy})
                    .attr("cx", function(d){return d.x})
                    ;

                merged.transition()
                .ease(d3.easeLinear)
                .duration(function(d,i){
                    var shots = total_shots * (d.data.opportunity + d.data.other);
                    return shots*5;
                })
                .delay(function(d,i){
                    var shots = total_shots * (d.data.opportunity + d.data.other);
                    //return shots*5;
                    return 0;
                })
                    .attr("r",function(d){return d.r})

                    .on("start", function(d,i){
                        if(i==0){tipdisabled = true}
                        var endX = d.x;
                        var endY = d.fy;
                        var shots = total_shots * (d.data.opportunity + d.data.other);
                        var shot_dots = g_flow.selectAll("circle"+d.data.occ_b).data(d3.range(0,shots));
                        shot_dots.exit().remove();
                        shot_dots.enter().append("circle").classed(d.data.occ_b,true).merge(shot_dots)
                            .attr("cx", startX).attr("cy", startY).attr("r",3).attr("fill","#0575B1")
                            .transition().duration(100).delay(function(d,i){return i*5})
                            .attr("cx", endX + (center*2)).attr("cy", endY)
                            .attr("r","1")
                            .on("end", function(){
                                //d3.select(this).remove();
                            })
                    })
                    .on("end", function(d,i){
                        if(i==merged.size()-1){
                            tipdisabled = false;
                            g_flow.selectAll("circle").remove();
                        }
                        
                    })
                    ;

            }            
        });
    }


    //MANAGE DRAWING

    //data cache
        var cache = {}

    //keep track of latest geo selected -- avoid callback confusion!
        var latest_geo = null;

    //fetch, then update
    function fetch_and_update(geo, width_){
        //record this request as the lates geo
        latest_geo = geo;

        if(arguments.length > 1){
            width = width_;
        }

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