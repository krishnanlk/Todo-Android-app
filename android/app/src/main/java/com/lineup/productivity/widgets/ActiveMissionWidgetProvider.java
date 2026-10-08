package com.lineup.productivity.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.widget.RemoteViews;

import com.lineup.productivity.MainActivity;
import com.lineup.productivity.R;

import org.json.JSONObject;

public class ActiveMissionWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName name = new ComponentName(context, ActiveMissionWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(name);
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_mission);

        String title = "AI PROJECT";
        int progress = 72;
        int daysRemaining = 3;

        try {
            SharedPreferences prefs = context.getSharedPreferences("LineUpWidgetData", Context.MODE_PRIVATE);
            String payloadStr = prefs.getString("payload", null);
            if (payloadStr != null && !payloadStr.trim().isEmpty()) {
                JSONObject json = new JSONObject(payloadStr);
                if (json.has("activeMission") && !json.isNull("activeMission")) {
                    JSONObject mission = json.getJSONObject("activeMission");
                    title = mission.optString("title", "AI Project").toUpperCase();
                    progress = mission.optInt("progress", 72);
                    daysRemaining = mission.optInt("daysRemaining", 3);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        views.setTextViewText(R.id.widget_mission_title, title);
        views.setTextViewText(R.id.widget_mission_days_left, daysRemaining + " days remaining");
        views.setTextViewText(R.id.widget_mission_percent_text, progress + "% Complete");
        views.setProgressBar(R.id.widget_mission_progress_bar, 100, Math.max(0, Math.min(100, progress)), false);

        // Tap to open Missions view in app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("lineup://missions"));
        intent.putExtra("tab", "missions");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                103,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_mission_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
