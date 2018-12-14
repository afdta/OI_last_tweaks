import dir from "../../../js-modules/rackspace.js";
import degradation from "../../../js-modules/degradation.js";

import opportunity_industries from "./opportunity-industries.js"; 
import flow_diagram from "./flow-diagram.js";
import metros_chart from "./metros-chart.js";

//main function
function main(){


  //local
  dir.local("./");
  //dir.add("data", "data");
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



  //browser degradation
  if(compat.browser()){

    var update_flow = flow_diagram(flow_node, scope);
    var update_industries  = opportunity_industries(industries_node, scope);
    var update_metros = metros_chart(metros_node, scope);

  }
  else{
    compat.alert(industry_node, "browser");
    compat.alert(metros_node, "browser");
  }


} //close main()


document.addEventListener("DOMContentLoaded", main);
