package com.lineup.productivity;

import android.content.Context;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.lineup.productivity.widgets.ActiveMissionWidgetProvider;
import com.lineup.productivity.widgets.ProgressWidgetProvider;
import com.lineup.productivity.widgets.QuickVoiceWidgetProvider;
import com.lineup.productivity.widgets.TodayFlowWidgetProvider;

@CapacitorPlugin(name = "LineUpWidgetPlugin")
public class LineUpWidgetPlugin extends Plugin {

    @PluginMethod
    public void updateWidgets(PluginCall call) {
        try {
            String payload = call.getString("payload");
            Context context = getContext();
            if (context != null && payload != null) {
                context.getSharedPreferences("LineUpWidgetData", Context.MODE_PRIVATE)
                        .edit()
                        .putString("payload", payload)
                        .apply();

                // Trigger update on all 4 Android Home-Screen widgets
                TodayFlowWidgetProvider.updateAllWidgets(context);
                ProgressWidgetProvider.updateAllWidgets(context);
                ActiveMissionWidgetProvider.updateAllWidgets(context);
                QuickVoiceWidgetProvider.updateAllWidgets(context);
            }
            call.resolve();
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Failed to update widgets", e);
        }
    }
}
