var fs = require('fs'),
	request = require('superagent'),
	merge = require('merge'),
	Promise = require('promise');

fs.readFile("./access_token", "utf-8", function (error, data) {
	if(error){
        console.log(error);
		console.log("No Access Token Found.");
		return;
	}
	access_token = data;


    var posts_id = []; // Save all event posts' id
    var posts_rank = []; // Save final results (id, message, like_count)
    
    
    //Get posts' id from the event
    var data = require('./data.json');
    data.data.map(function(value,index){
    	var url = value.posts.href;
    	if(url !== ""){
    		//improve: use reguar expression?
    		posts_id.push(url.split('permalink/')[1].split('/')[0]);
    	}
    });
    
    
    //Get message and like count
    posts_id.map(function(value, index){

    	var url = 'https://graph.facebook.com/' + value;
    	
    	getLikeCount(url).then(function (d) {
    
    		var post = merge(d, {id: value});
    		//console.log(post);
    		posts_rank.push(post);
    
    		// is last
    		if(index === posts_id.length - 1){
    		    posts_rank.sort(function (a, b) {
    		    	return b.like_count - a.like_count;
    		    })
    		    //console.log(posts_rank);
    		    fs.writeFile("fetch/result.json", JSON.stringify(posts_rank, null, 4), function(err){
    		    	if(!err) console.log("* succeeded! * File saved as result.json");
    		    });
    		}
    		
    	})
    
    });
    

});

//var url = 'https://graph.facebook.com/1020351077975047/'
//Get each posts' message and like count
function getLikeCount(url){
	
	return new Promise(function(resolve, reject){
        request
            .get( url + '/likes')
            .query({
            	summary: true,
            	access_token: access_token
            })
            .end(function(err, res){
            	if(err){
            		console.log("error. please check your token.");
            		process.exit();
            	}
            	var message = "";
            	var like_count = JSON.parse(res.text).summary.total_count;
            
            	request.get( url)
            	.query({
            		access_token: access_token
            	})
            	.end(function(err, res){
            		message = JSON.parse(res.text).message;
            		//console.log(message+": "+like_count);
            		return err ? reject(err):resolve({ message:message, like_count:like_count});
            		
            	});
            		
            });
	});

      
}
  