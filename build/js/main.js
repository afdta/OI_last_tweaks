import dir from "../../../js-modules/rackspace.js";
import degradation from "../../../js-modules/degradation.js";

import flow_diagram from "./flow-diagram.js";


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
  var compat = degradation(flow_node);

  var scope = {
    cbsa: "cbsa_code_here",
    width: 1400
  }


  //browser degradation
  if(compat.browser()){
    
    var update_flow = flow_diagram(flow_node, scope.width);

    function update(cbsa){
      if(arguments.length > 0){
        scope.cbsa = cbsa;
      }

      update_flow(scope.cbsa, scope.width);
    }

    update();


  }


} //close main()


document.addEventListener("DOMContentLoaded", main);
