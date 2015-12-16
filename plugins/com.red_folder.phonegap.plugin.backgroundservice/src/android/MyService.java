package com.red_folder.phonegap.plugin.backgroundservice.MyService;

import com.red_folder.phonegap.plugin.backgroundservice.BackgroundService;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;
import java.text.SimpleDateFormat;
import java.util.Date;

public class MyService extends BackgroundService {
    
	@Override
	protected JSONObject doWork() {
   		try {
        	// Following three lines simply produce a text string with Hello World and the date & time (UK format)
        	SimpleDateFormat df = new SimpleDateFormat("dd/MM/yyyy HH:mm:ss"); 
        	String now = df.format(new Date(System.currentTimeMillis())); 
        	String msg = "Hello World - its currentry " + now;

        	// We output the message to the logcat
        	Log.d("MyService", msg);
            
//            String stroedAccessToken = "access_token: "+CordovaPreferences.getString("access_token", "nothing");
//            log.d("MyService", stroedAccessToken);

        	// We also provide the same message in our JSON Result
        	result.put("Message", msg);
   		} catch (JSONException e) {
      		// In production code, you would have some exception handling here
   		}

   return result;
	}

	@Override
	protected JSONObject getConfig() {
    	return null;
	}

	@Override
	protected void setConfig(JSONObject config) {

	}     

	@Override
	protected JSONObject initialiseLatestResult() {
    	return null;
	}

}