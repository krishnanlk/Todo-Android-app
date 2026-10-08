package com.lineup.productivity.widgets;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;

import com.lineup.productivity.MainActivity;
import com.lineup.productivity.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;

public class TodayFlowWidgetProvider extends AppWidgetProvider {

    public static class FlowItem {
        public String time;
        public String title;
        public int durationMinutes;
        public boolean isCompleted;

        public FlowItem(String time, String title, int durationMinutes, boolean isCompleted) {
            this.time = time;
            this.title = title;
            this.durationMinutes = durationMinutes;
            this.isCompleted = isCompleted;
        }

        public int getStartMinutes() {
            try {
                String[] parts = time.split(":");
                int h = Integer.parseInt(parts[0].trim());
                int m = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
                return h * 60 + m;
            } catch (Exception e) {
                return 480; // fallback 08:00
            }
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    public static void updateAllWidgets(Context context) {
        try {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName name = new ComponentName(context, TodayFlowWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(name);
            for (int id : ids) {
                updateAppWidget(context, manager, id);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_today_flow);

            List<FlowItem> allItems = loadFlowItems(context);

            // Current live time in minutes from midnight
            Calendar now = Calendar.getInstance();
            int currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE);

            // Find index of current or next upcoming routine to auto-scroll / center the window
            int activeIndex = 0;
            for (int i = 0; i < allItems.size(); i++) {
                FlowItem item = allItems.get(i);
                int start = item.getStartMinutes();
                int end = start + Math.max(item.durationMinutes, 45);
                if (currentMinutes >= start && currentMinutes < end) {
                    activeIndex = i;
                    break;
                } else if (currentMinutes < start) {
                    activeIndex = Math.max(0, i - 1);
                    break;
                }
                if (i == allItems.size() - 1) {
                    activeIndex = Math.max(0, allItems.size() - 4);
                }
            }

            // Window of 4 items around activeIndex
            int startIndex = Math.max(0, Math.min(activeIndex, allItems.size() - 4));
            int[] rowIds = new int[] { R.id.flow_row_1, R.id.flow_row_2, R.id.flow_row_3, R.id.flow_row_4 };
            int[] timeIds = new int[] { R.id.row_1_time, R.id.row_2_time, R.id.row_3_time, R.id.row_4_time };
            int[] titleIds = new int[] { R.id.row_1_title, R.id.row_2_title, R.id.row_3_title, R.id.row_4_title };
            int[] statusIds = new int[] { R.id.row_1_status, R.id.row_2_status, R.id.row_3_status, R.id.row_4_status };

            for (int r = 0; r < 4; r++) {
                int itemIdx = startIndex + r;
                if (itemIdx < allItems.size()) {
                    FlowItem item = allItems.get(itemIdx);
                    int start = item.getStartMinutes();
                    int end = start + Math.max(item.durationMinutes, 45);

                    String statusText = "Upcoming";
                    int statusColor = Color.parseColor("#0A84FF");

                    if (item.isCompleted) {
                        statusText = "Done ✓";
                        statusColor = Color.parseColor("#30D158");
                    } else if (currentMinutes >= start && currentMinutes < end) {
                        statusText = "NOW ⚡";
                        statusColor = Color.parseColor("#BF5AF2");
                    } else if (currentMinutes >= end) {
                        statusText = "Done ✓";
                        statusColor = Color.parseColor("#30D158");
                    }

                    views.setViewVisibility(rowIds[r], View.VISIBLE);
                    views.setTextViewText(timeIds[r], item.time);
                    views.setTextViewText(titleIds[r], item.title);
                    views.setTextViewText(statusIds[r], statusText);
                    views.setTextColor(statusIds[r], statusColor);
                } else {
                    views.setViewVisibility(rowIds[r], View.GONE);
                }
            }

            // Tap on widget opens Life Flow in LineUp
            Intent intent = new Intent(context, MainActivity.class);
            intent.setAction(Intent.ACTION_VIEW);
            intent.setData(Uri.parse("lineup://flow"));
            intent.putExtra("tab", "flow");
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    context,
                    101,
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_flow_container, pendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static List<FlowItem> loadFlowItems(Context context) {
        List<FlowItem> list = new ArrayList<>();
        try {
            SharedPreferences prefs = context.getSharedPreferences("LineUpWidgetData", Context.MODE_PRIVATE);
            String payloadStr = prefs.getString("payload", null);
            if (payloadStr != null && !payloadStr.trim().isEmpty()) {
                JSONObject json = new JSONObject(payloadStr);
                if (json.has("activeFlowItems")) {
                    JSONArray arr = json.getJSONArray("activeFlowItems");
                    for (int i = 0; i < arr.length(); i++) {
                        JSONObject item = arr.getJSONObject(i);
                        String time = item.optString("time", "08:00");
                        String title = item.optString("title", "Routine");
                        int duration = item.optInt("durationMinutes", 60);
                        String status = item.optString("status", "upcoming");
                        boolean isDone = "completed".equalsIgnoreCase(status);
                        list.add(new FlowItem(time, title, duration, isDone));
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Built-in complete 24h Life Flow if user hasn't set any yet
        if (list.isEmpty()) {
            list.add(new FlowItem("07:00", "Morning Routine & Wake", 45, true));
            list.add(new FlowItem("08:30", "College / Deep Study", 210, false));
            list.add(new FlowItem("13:00", "Lunch & Recharge", 60, false));
            list.add(new FlowItem("15:00", "AI Project Development", 120, false));
            list.add(new FlowItem("18:00", "Exercise & Fitness", 60, false));
            list.add(new FlowItem("20:30", "Evening Review & Reading", 60, false));
            list.add(new FlowItem("22:30", "Wind Down & Sleep", 480, false));
        }

        return list;
    }
}
