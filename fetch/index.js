var fs = require('fs'),
	request = require('superagent'),
	merge = require('merge'),
	Promise = require('promise');

// var event_id = "1018717151471773";//父權
// event_id = "422088457976284";//數學家

var feeds = []; //save all the feeds
var page_index = 1;

fs.readFile("./config/access_token", "utf-8", function (error, data) {
	if(error){
        console.log(error);
		console.log("No Access Token Found.");
		return;
	}
	access_token = data;

    fs.readFile("./config/event_id", "utf-8", function (error, data) {
        if(error){
            console.log(error);
            console.log("No Event ID Found.");
            return;
        }
        event_id = data;
    
        /*
        https://graph.facebook.com/1018717151471773/feed?summary=true&access_token=CAACEdEose0cBACxZAAgGuhCUTUal0yvLkRhMGQ8nML8SjxV8SOaqPLpa8RMFNv1aMQa8MGMz5v0dVwvBPbOOzl8Lzkc6kYbSZBF1mwSdomLEokGRXag3jJbGa8HfJDyDIgkCsbG0y2ZBaN7ZCNn3A24B5DbgempGAZCz7EKiEoV3sJxQR5yfFkGSybg01LI7NaU377lzf0gZDZD
        */
        var url = "https://graph.facebook.com/" + event_id + '/feed';
        getFeed(url).then(function (d) {

            console.log("resolve:"+d);
        });
    });
});

function getFeed(url){
	
	return new Promise(function(resolve, reject){
        request
            .get( url )
            .query({
                summary: true,
            	access_token: access_token
            })
            .end(function(err, res){
            	if(err){
                    console.log(err);
            		console.log("error. please check your token.");
            		process.exit();
            	}

                res = JSON.parse(res.text);
                if(res.data.length === 0){
                    console.log("FETCH FEEDS ENDED.");
                    console.log("Total posts count: "+feeds.length);

                    fs.writeFile("UpdateTime.text", new Date(), function(err){
                        if(!err) console.log("-update time");
                    });
                    fs.writeFile("fetch/feeds.json", JSON.stringify(feeds, null, 4), function(err){
                        if(!err) console.log("* succeeded! * File saved as feeds.json");
                    });
                    return;
                }else{
                    console.log("fetch: page "+ page_index + " - " + res.data.length + " feeds...");
                    //console.log(res);
                    res.data.map(function(value,index){
                       feeds.push(value);
                    });
                    
     
                    if(!res.paging || (!res.paging.next)){
                        return;
                        
                    }else{
                        page_index++;
                        getFeed(res.paging.next);
                    }
                

                }

               
            		
            	
            		
            });
	});

      
}
  