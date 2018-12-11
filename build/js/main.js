import dir from "../../../js-modules/rackspace.js";
import degradation from "../../../js-modules/degradation.js";

import {cbsas} from './industry-data.js';
import opportunity_industries from "./opportunity-industries.js"; 
import flow_diagram from "./flow-diagram.js";
import metro_select from "./metro-select.js";
import metros_chart from "./metros-chart.js";

//main function
function main(){


  //local
  dir.local("./");
  dir.add("data", "data");
  //dir.add("dirAlias", "path/to/dir");


  //production data
  //dir.add("dirAlias", "rackspace-slug/path/to/dir");
  //dir.add("dirAlias", "rackspace-slug/path/to/dir");
  
  var flow_node = document.getElementById("flow-diagram");
  var industries_node = document.getElementById("opportunity-industries");
  var metros_node = document.getElementById("metros-chart");

  var compat = degradation(flow_node);

  var scope = {
    cbsa: "10420",
    width: 900
  }

  var select_factory = metro_select(cbsas);

  //browser degradation
  if(compat.browser()){

    //add containers for select module
    var flow_select = document.getElementById("occupation-flows-select");
    var industry_select = document.getElementById("opportunity-industries-select");
    var metro_shares_select = document.getElementById("metro-shares-select");
    
    // wire up selects differently? get update functions then just add them to callbacks later on
    // update_flow gets update_industries_ in callback...

    var update_flow_ = flow_diagram(flow_node, scope);
    var update_flow = select_factory(flow_select, update_flow_);

    var update_industries_ = opportunity_industries(industries_node, scope);
    var update_industries = select_factory(industry_select, update_industries_);

    var update_metros_ = metros_chart(metros_node);
    var update_metros = select_factory(metro_shares_select, update_metros_);

    



    //add cbsa selection controls to each panel
    function update(cbsa){
      if(arguments.length > 0){
        scope.cbsa = cbsa;
      }
      setTimeout(function(){
        update_flow(scope.cbsa);
        update_industries(scope.cbsa);
        update_metros(scope.cbsa);
      }, 0);
    }

    update();

  }
  else{
    compat.alert(industry_node, "browser");
    compat.alert(metros_node, "browser");
  }


} //close main()


document.addEventListener("DOMContentLoaded", main);
