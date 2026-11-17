package fr.pauseecran

import android.content.Context
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.doAfterTextChanged
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.button.MaterialButton
import com.google.android.material.checkbox.MaterialCheckBox
import com.google.android.material.textfield.TextInputEditText

/** Liste des applis installées avec cases à cocher. */
class AppPickerActivity : AppCompatActivity() {

    private val selected = HashSet<String>()
    private var all: List<AppEntry> = emptyList()
    private lateinit var adapter: AppAdapter
    private lateinit var btnSave: MaterialButton
    private lateinit var search: TextInputEditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_app_picker)
        btnSave = findViewById(R.id.btnSave)
        search = findViewById(R.id.search)

        adapter = AppAdapter(this, selected) { updateSaveLabel() }
        findViewById<RecyclerView>(R.id.list).apply {
            layoutManager = LinearLayoutManager(this@AppPickerActivity)
            adapter = this@AppPickerActivity.adapter
        }
        search.doAfterTextChanged { filter() }
        btnSave.setOnClickListener {
            Prefs.setAllowed(this, selected)
            setResult(RESULT_OK)
            finish()
        }

        Thread {
            val apps = AppRules.launchableApps(this)
            val initial = if (Prefs.hasAllowedList(this)) Prefs.allowed(this)
            else AppRules.defaultAllowed(this, apps)
            runOnUiThread {
                all = apps
                selected.clear()
                selected += initial
                findViewById<View>(R.id.loading).visibility = View.GONE
                filter()
                updateSaveLabel()
            }
        }.start()
    }

    private fun filter() {
        val q = AppRules.normalize(search.text?.toString().orEmpty())
        adapter.submit(if (q.isEmpty()) all else all.filter { AppRules.normalize(it.label).contains(q) })
    }

    private fun updateSaveLabel() {
        btnSave.text = "Enregistrer (${selected.size})"
    }
}

class AppAdapter(
    private val ctx: Context,
    private val selected: MutableSet<String>,
    private val onChange: () -> Unit,
) : RecyclerView.Adapter<AppAdapter.VH>() {

    private var items: List<AppEntry> = emptyList()
    private val icons = HashMap<String, Drawable?>()

    class VH(v: View) : RecyclerView.ViewHolder(v) {
        val icon: ImageView = v.findViewById(R.id.icon)
        val name: TextView = v.findViewById(R.id.name)
        val check: MaterialCheckBox = v.findViewById(R.id.check)
    }

    @android.annotation.SuppressLint("NotifyDataSetChanged")
    fun submit(list: List<AppEntry>) {
        items = list
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int) =
        VH(LayoutInflater.from(parent.context).inflate(R.layout.item_app_pick, parent, false))

    override fun getItemCount() = items.size

    override fun onBindViewHolder(h: VH, position: Int) {
        val e = items[position]
        h.name.text = e.label
        h.icon.setImageDrawable(icons.getOrPut(e.pkg) { AppRules.icon(ctx, e.pkg) })
        h.check.isChecked = e.pkg in selected
        h.itemView.setOnClickListener {
            if (!selected.remove(e.pkg)) selected.add(e.pkg)
            h.check.isChecked = e.pkg in selected
            onChange()
        }
    }
}
