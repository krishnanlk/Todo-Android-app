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

public class ProgressWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName name = new ComponentName(context, ProgressWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(name);
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_progress);

        int total = 5;
        int completed = 2;
        int percentage = 40;

        try {
            SharedPreferences prefs = context.getSharedPreferences("LineUpWidgetData", Context.MODE_PRIVATE);
            String payloadStr = prefs.getString("payload", null);
            if (payloadStr != null && !payloadStr.trim().isEmpty()) {
                JSONObject json = new JSONObject(payloadStr);
                if (json.has("todaySummary")) {
                    JSONObject summary = json.getJSONObject("todaySummary");
                    total = summary.optInt("total", 5);
                    completed = summary.optInt("completed", 2);
                    percentage = summary.optInt("percentage", 40);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        views.setTextViewText(R.id.widget_progress_text, completed + " / " + total + " Tasks Done");
        views.setTextViewText(R.id.widget_progress_percent, percentage + "% Completed");
        views.setProgressBar(R.id.widget_progress_bar, 100, Math.max(0, Math.min(100, percentage)), false);

        // Tap to open Today view in app
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse("lineup://today"));
        intent.putExtra("tab", "today");
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                102,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_progress_container, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}
