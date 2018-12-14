import map from "../../../js-modules/state-map.js";
import {geos_state} from "../../../js-modules/geos-state.js";
import geos_cbsa from "../../../js-modules/geos-cbsa.js";

import palette from "../../../js-modules/palette.js";

export default function small_map(container){

    var wrap = d3.select(container).append("div").classed("c-fix",true);

    var map_wrap = wrap.append("div").style("width", "110px")
        .style("margin-right","15px")
        .style("float","left")
        .style("clear","left")
        .classed("mi-desktop-view",true);

    var highlight_map = map(map_wrap.node());
        highlight_map.add_states(geos_state.features, function(d){return d.properties.geo_id})
                    .attr({fill:"#999999", stroke:"#ffffff", "stroke-width":"0.5px"});
        
    var cbsa_layer = highlight_map.add_points(geos_cbsa, function(d){return d.cbsa}, function(d){return [d.lon, d.lat]}).attr({r:"0"});

    //update map, run callback with this.title()
    function update(cbsa){
        //update map
        cbsa_layer.attr({r:function(d){return d == cbsa ? "4" : "0"}, fill:"#ffa200", stroke:"#555555"});
        highlight_map.print(110);
    }
    
    return update;

}
