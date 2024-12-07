package com.example.dummy;

import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends AppCompatActivity {

    private TextView tvPH, tvTurbidity, tvDO, tvEC, tvTemp, tvORP, tvTDS;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Make the activity full-screen by hiding the status bar and navigation bar
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);

        // Hide the status bar
        View decorView = getWindow().getDecorView();
        int uiOptions = View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY;
        decorView.setSystemUiVisibility(uiOptions);

        setContentView(R.layout.activity_main);

        // Initialize TextViews
        tvPH = findViewById(R.id.tvPH);
        tvTurbidity = findViewById(R.id.tvTurbidity);
        tvDO = findViewById(R.id.tvDO);
        tvEC = findViewById(R.id.tvEC);
        tvTemp = findViewById(R.id.tvTemp);
        tvORP = findViewById(R.id.tvORP);
        tvTDS = findViewById(R.id.tvTDS);

        // Start AsyncTask to fetch data
        new FetchDataTask().execute("https://api.thingspeak.com/channels/2732596/feeds.json?results=1");
    }

    private class FetchDataTask extends AsyncTask<String, Void, String> {

        @Override
        protected String doInBackground(String... urls) {
            try {
                // Create URL object from the string URL
                URL url = new URL(urls[0]);
                HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
                urlConnection.setRequestMethod("GET");
                urlConnection.setConnectTimeout(15000);
                urlConnection.setReadTimeout(15000);

                // Read the response
                InputStreamReader in = new InputStreamReader(urlConnection.getInputStream());
                StringBuilder response = new StringBuilder();
                int data;
                while ((data = in.read()) != -1) {
                    response.append((char) data);
                }
                in.close();

                return response.toString(); // Return JSON response as a string
            } catch (Exception e) {
                Log.e("FetchDataTask", "Error fetching data", e);
                return null;
            }
        }

        @Override
        protected void onPostExecute(String result) {
            super.onPostExecute(result);

            if (result != null) {
                try {
                    // Parse the JSON response
                    JSONObject jsonResponse = new JSONObject(result);
                    JSONArray feeds = jsonResponse.getJSONArray("feeds");
                    JSONObject latestFeed = feeds.getJSONObject(0);

                    // Extract data fields
                    String pH = latestFeed.getString("field1");
                    String turbidity = latestFeed.getString("field2");
                    String dissolvedOxygen = latestFeed.getString("field3");
                    String electricalConductivity = latestFeed.getString("field4");
                    String temperature = latestFeed.getString("field5");
                    String orp = latestFeed.getString("field6");
                    String tds = latestFeed.getString("field7");

                    // Update UI elements with the data
                    tvPH.setText("pH: " + pH);
                    tvTurbidity.setText("Turbidity: " + turbidity);
                    tvDO.setText("Dissolved Oxygen: " + dissolvedOxygen);
                    tvEC.setText("Electrical Conductivity: " + electricalConductivity);
                    tvTemp.setText("Temperature: " + temperature);
                    tvORP.setText("Oxidation-Reduction Potential: " + orp);
                    tvTDS.setText("Total Dissolved Solids: " + tds);

                } catch (Exception e) {
                    Log.e("MainActivity", "Error parsing JSON response", e);
                }
            }
        }
    }
}
