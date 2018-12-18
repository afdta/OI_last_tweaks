    ///CACHING AND DATA RETRIEVAL BELOW

    //data cache
    var cache = {}

    //fetch, then update
    function fetch_and_update(geo){
        //record this request as the lates geo
        latest_geo = geo;

        //1) look in cache for data, if not there 2) fetch, store in cache, then update
        if(cache.hasOwnProperty(geo)){
            var data = cache[geo];
            //synchronous update
            update(data);
        }
        else{
            var url = dir.url("data", "msp.json");
            d3.json(url).then(function(data){
                //store data in cache
                cache[geo] = data;
                //if no subsequent requests have overridden this one, update with this geo and data
                if(geo == latest_geo){
                    update(cache[geo]);
                }
            });
        }

    }