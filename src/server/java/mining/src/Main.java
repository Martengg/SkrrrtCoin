import java.io.*;
import java.math.BigInteger;
import java.net.*;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
//import org.apache.hc.client5.http.classic.HttpClient;
//import org.apache.hc.client5.http.classic.methods.HttpPost;
//import org.apache.hc.client5.http.entity.UrlEncodedFormEntity;
//import org.apache.hc.client5.http.impl.classic.HttpClients;
//import org.apache.hc.core5.http.HttpResponse;
//import org.apache.hc.core5.http.NameValuePair;
//import org.apache.hc.core5.http.message.BasicNameValuePair;
import org.json.JSONException;
import org.json.JSONObject;

public class Main {
    public static String getPublicKey() { return "193"; /* please enter here your own public-key */ }

    // server communication information

    public static String getApiEndpoint() { return "https://skrt.koaladev.de"; }


    public static String getRequestUrl() { return "/api/mine/start/skrt"; }


    public static String getPostUrl() { return "/api/mine/finish/skrt"; }

    
    private static String readAll(Reader reader) throws IOException {
        StringBuilder builder = new StringBuilder();
        int cp;

        while ((cp = reader.read()) != -1) {
            builder.append((char) cp);
        }

        return builder.toString();
    }


    public static JSONObject requestData() throws IOException, JSONException {
        // set the GET-request up
        String url = getApiEndpoint() + getRequestUrl();
        InputStream input = new URL(url).openStream();

        try {
            BufferedReader reader = new BufferedReader(new InputStreamReader(input, Charset.forName("UTF-8")));
            String jsonText = readAll(reader);
            JSONObject jsonResponse = new JSONObject(jsonText);

            return jsonResponse;
        }

        finally {
            input.close();
        }
    }


    public static int crackHash(int hash) throws NoSuchAlgorithmException {
        int solution = 1;

        while (true) {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(String.valueOf(hash + solution).getBytes());
            byte[] digest = md.digest();

            BigInteger no = new BigInteger(1, digest);

            String hashText = no.toString(16);
            while (hashText.length() < 32) {
                hashText = "0" + hashText;
            }

            if (hashText.startsWith("000000")) {
                return solution;
            }

            solution++;
        }
    }


    private static final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(10))
            .build();


    public static void postSolution(String uuid, int solution) throws IOException, InterruptedException {
        // set the POST-request up
         String json = "{ \"uuid\": \"" + uuid + "\",  \"solution\": " + solution + ",  \"wallet_key\": \"" + getPublicKey() + "\"}";
         HttpRequest request = HttpRequest.newBuilder()
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .uri(URI.create(getApiEndpoint() + getPostUrl()))
                .setHeader("User-Agent", "Java 11 HttpClient Bot") // add request header
                .header("Content-Type", "application/json")
                .build();

         HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        // print mining success
        if (String.valueOf(response.statusCode()).startsWith("20")) {
            System.out.println("posted the solution successfully!");
            return;
        }

        System.out.println("posting the solution failed, maybe the solution was wrong... :c");
        return;
    }


    public static void main(String[] args) throws JSONException, IOException, NoSuchAlgorithmException, InterruptedException {
        while (true) {
            System.out.println("requesting data...");
            JSONObject response = requestData();

            System.out.println("started mining the nonce");
            int solution = crackHash((int) response.get("nonce"));
            System.out.println("finished mining the nonce, solution: " + solution);

            postSolution(response.get("uuid").toString(), solution);
        }
    }
}