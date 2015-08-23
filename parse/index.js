var async = require('async'),
    fs = require('fs'),
    merge = require('merge'),
    Promise = require('promise'),
	request = require('superagent');

var batch_amount = 2000;
var batch_start = 0;
var batch_end = 0;
	
fs.readFile("./config/access_token", "utf-8", function (error, data) {
	if(error){
        console.log(error);
		console.log("No Access Token Found.");
		return;
	}
	access_token = data;


    var posts_id = []; // Save all event posts' id
    var posts_rank = []; // Save final results (id, message, like_count)
    
    
    //Get posts' id from the event
    var data = require('../fetch/feeds.json');
    data.map(function(value,index){
        //console.log("[" + (index+1) + "] ID "+value.id);
    	
    	if(value.id !== ""){
    		posts_id.push(value.id.split('_')[1]);
    	}
    });
    
    
    // Get message and like count
    // create a queue object with concurrency 1
    var queue = async.queue(function (task, callback) {
        
        console.log("Hello Task!"+task.value);
        
        var value = task.value;
        var url = 'https://graph.facebook.com/' + value;
        
        getLikeCount(url).then(function (d) {
            
            var post = merge(d, {id: value, url: "https://www.facebook.com/"+value});
            
            posts_rank.push(post);
            callback();
        })


    }, 100);

    queue.drain = function() {
        if(batch_end === posts_id.length){

            posts_rank.sort(function (a, b) {
                return b.like_count - a.like_count;
            })
            //console.log(posts_rank);
            fs.writeFile("parse/result.json", JSON.stringify(posts_rank, null, 4), function(err){
                if(!err) console.log("* succeeded! * File saved as result.json");
            });

        }else{

            //Next Batch
            batch_start = batch_end;
            batch_end = Math.min(batch_end+batch_amount, posts_id.length);
            console.log("Batch Start: "+batch_start+", Batch End: "+batch_end);

            for(var i = batch_start ; i<batch_end ; i++){
                //console.log(posts_id[i]);
                queue.push({value:posts_id[i],index:i}, function (err, res) {
                      console.log("Finished");
                      if(err) console.log(err);
                });
            
            }

        }

    };

    batch_end = Math.min(batch_amount, posts_id.length);//min(2000,4xxx)
    for(var i = 0 ; i<batch_end ; i++){
        //console.log(posts_id[i]);
        queue.push({value:posts_id[i],index:i}, function (err, res) {
              console.log("Finished");
              if(err) console.log(err);
        });
    
    }
    
      

});

//var url = 'https://graph.facebook.com/1020351077975047/'
//Get each posts' message and like count
function getLikeCount(url){
	console.log(url);
	return new Promise(function(resolve, reject){
        request
            .get( url )
            .query({
            	access_token: access_token
            })
            .end(function(err, res){
                //console.log(res.text);
            	if(err){
            		console.log("Error1. please check your token.");

                    console.log(err);
                    console.log(url);
                    return reject(err); 
            		//process.exit();
            	}else{
            	    var message = JSON.parse(res.text).message || "Photo Post";
            	       
            	    request.get( url + '/likes')
            	    .query({
                        summary: true,
            	    	   access_token: access_token
            	    })
            	    .end(function(err, res){
            	    	if(err){
                            console.log("Error2. please check your token.");
                            console.log(err);
                            console.log(url);
                            return reject(err); 
                        }else{
                            var like_count = JSON.parse(res.text).summary.total_count;
            	    	    console.log(message+": "+like_count);
            	    	    return resolve({ message:message, like_count:like_count});
                        }
            	    	
            	   });
                }
            		
            });
	});

      
}
  