package com.lineup.productivity;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LineUpWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
