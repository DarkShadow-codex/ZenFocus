package com.zenfocus.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class ZenFocusBlockedActivity : Activity() {

    companion object {
        const val EXTRA_PACKAGE_NAME = "extra_package_name"
        const val EXTRA_APP_LABEL = "extra_app_label"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val appLabel = intent.getStringExtra(EXTRA_APP_LABEL) ?: "This Application"
        val packageName = intent.getStringExtra(EXTRA_PACKAGE_NAME) ?: ""

        // Root container: dark sleek backdrop
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.parseColor("#090b10"))
            setPadding(48, 64, 48, 64)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Card container
        val card = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            val cardBg = GradientDrawable().apply {
                setColor(Color.parseColor("#151824"))
                cornerRadius = 32f
                setStroke(2, Color.parseColor("#2a3048"))
            }
            background = cardBg
            setPadding(48, 56, 48, 56)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            )
        }

        // Icon circle
        val iconBox = TextView(this).apply {
            text = "🔒"
            textSize = 42f
            gravity = Gravity.CENTER
            val circleBg = GradientDrawable().apply {
                setColor(Color.parseColor("#22283d"))
                cornerRadius = 80f
            }
            background = circleBg
            val size = (84 * resources.displayMetrics.density).toInt()
            layoutParams = LinearLayout.LayoutParams(size, size).apply {
                bottomMargin = 32
            }
        }
        card.addView(iconBox)

        // App blocked title
        val titleText = TextView(this).apply {
            text = "$appLabel is Blocked"
            textSize = 22f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            paint.isFakeBoldText = true
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 16
            }
        }
        card.addView(titleText)

        // Policy badge
        val badge = TextView(this).apply {
            text = "🛡️ ZenFocus Restriction Active"
            textSize = 12f
            setTextColor(Color.parseColor("#5146e5"))
            paint.isFakeBoldText = true
            gravity = Gravity.CENTER
            val badgeBg = GradientDrawable().apply {
                setColor(Color.parseColor("#1e2238"))
                cornerRadius = 24f
            }
            background = badgeBg
            setPadding(24, 10, 24, 10)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 24
            }
        }
        card.addView(badge)

        // Subtitle explanation
        val descText = TextView(this).apply {
            text = "Access to this application is restricted by Parent Guardian or your active Study Focus Session.\n\nKeep focusing on what matters!"
            textSize = 14f
            setTextColor(Color.parseColor("#9aa4b8"))
            gravity = Gravity.CENTER
            setLineSpacing(6f, 1.1f)
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = 48
            }
        }
        card.addView(descText)

        // Return to ZenFocus Button
        val openAppBtn = Button(this).apply {
            text = "Open ZenFocus Hub"
            setTextColor(Color.WHITE)
            paint.isFakeBoldText = true
            val btnBg = GradientDrawable().apply {
                setColor(Color.parseColor("#5146e5"))
                cornerRadius = 28f
            }
            background = btnBg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                (52 * resources.displayMetrics.density).toInt()
            ).apply {
                bottomMargin = 16
            }
            setOnClickListener {
                val launchIntent = packageManager.getLaunchIntentForPackage(packageName) ?: Intent(this@ZenFocusBlockedActivity, MainActivity::class.java)
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
                startActivity(launchIntent)
                finish()
            }
        }
        card.addView(openAppBtn)

        // Dismiss / Go to Home Button
        val closeBtn = Button(this).apply {
            text = "Close"
            setTextColor(Color.parseColor("#7e889e"))
            val btnBg = GradientDrawable().apply {
                setColor(Color.TRANSPARENT)
                cornerRadius = 28f
            }
            background = btnBg
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                (44 * resources.displayMetrics.density).toInt()
            )
            setOnClickListener {
                val homeIntent = Intent(Intent.ACTION_MAIN).apply {
                    addCategory(Intent.CATEGORY_HOME)
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                startActivity(homeIntent)
                finish()
            }
        }
        card.addView(closeBtn)

        root.addView(card)
        setContentView(root)
    }

    override fun onBackPressed() {
        val homeIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(homeIntent)
        finish()
    }
}
