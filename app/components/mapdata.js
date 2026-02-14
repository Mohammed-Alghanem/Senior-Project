var simplemaps_countrymap_mapdata={
  main_settings: {
    //General settings
		width: "responsive", //or 'responsive'
    background_color: "#FFFFFF",
    background_transparent: "yes",
    border_color: "#ffffff",
    pop_ups: "detect",
    
		//State defaults
		state_description: "State description",
    state_color: "#88A4BC",
    state_hover_color: "#3B729F",
    state_url: "",
    border_size: 1.5,
    all_states_inactive: "no",
    all_states_zoomable: "yes",
    
		//Location defaults
		location_description: "Location description",
    location_url: "",
    location_color: "#FF0067",
    location_opacity: 0.8,
    location_hover_opacity: 1,
    location_size: 25,
    location_type: "square",
    location_image_source: "frog.png",
    location_border_color: "#FFFFFF",
    location_border: 2,
    location_hover_border: 2.5,
    all_locations_inactive: "no",
    all_locations_hidden: "no",
    
		//Label defaults
		label_color: "#ffffff",
    label_hover_color: "#ffffff",
    label_size: 16,
    label_font: "Arial",
    label_display: "auto",
    label_scale: "yes",
    hide_labels: "no",
    hide_eastern_labels: "no",
   
		//Zoom settings
		zoom: "yes",
    manual_zoom: "yes",
    back_image: "no",
    initial_back: "no",
    initial_zoom: "-1",
    initial_zoom_solo: "no",
    region_opacity: 1,
    region_hover_opacity: 0.6,
    zoom_out_incrementally: "yes",
    zoom_percentage: 0.99,
    zoom_time: 0.5,
    
		//Popup settings
		popup_color: "white",
    popup_opacity: 0.9,
    popup_shadow: 1,
    popup_corners: 5,
    popup_font: "12px/1.5 Verdana, Arial, Helvetica, sans-serif",
    popup_nocss: "no",
    
		//Advanced settings
		div: "map",
    auto_load: "yes",
    url_new_tab: "no",
    images_directory: "default",
    fade_time: 0.1,
    link_text: "View Website"
  },
  state_specific: {
    SA01: {
      name: "Ar Riyad",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA02: {
      name: "Makkah",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA03: {
      name: "Al Madinah",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA04: {
      name: "Ash Sharqiyah",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA05: {
      name: "Al Quassim",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA06: {
      name: "Ha'il",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA07: {
      name: "Tabuk",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA08: {
      name: "Al Hudud ash Shamaliyah",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA09: {
      name: "Jizan",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA10: {
      name: "Najran",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA11: {
      name: "Al Bahah",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA12: {
      name: "Al Jawf",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    },
    SA14: {
      name: "`Asir",
      description: "default",
      color: "default",
      hover_color: "default",
      url: "default"
    }
  },
  locations: {
    "0": {
      name: "Riyadh",
      lat: "24.653837",
      lng: "46.715683"
    }
  },
  labels: {
    SA01: {
      name: "Ar Riyad",
      parent_id: "SA01"
    },
    SA02: {
      name: "Makkah",
      parent_id: "SA02"
    },
    SA03: {
      name: "Al Madinah",
      parent_id: "SA03"
    },
    SA04: {
      name: "Ash Sharqiyah",
      parent_id: "SA04"
    },
    SA05: {
      name: "Al Quassim",
      parent_id: "SA05"
    },
    SA06: {
      name: "Ha'il",
      parent_id: "SA06"
    },
    SA07: {
      name: "Tabuk",
      parent_id: "SA07"
    },
    SA08: {
      name: "Al Hudud ash Shamaliyah",
      parent_id: "SA08"
    },
    SA09: {
      name: "Jizan",
      parent_id: "SA09"
    },
    SA10: {
      name: "Najran",
      parent_id: "SA10"
    },
    SA11: {
      name: "Al Bahah",
      parent_id: "SA11"
    },
    SA12: {
      name: "Al Jawf",
      parent_id: "SA12"
    },
    SA14: {
      name: "`Asir",
      parent_id: "SA14"
    }
  }
};