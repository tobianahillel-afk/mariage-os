# Default Criteria Registry

Status: **Normative seeded criteria/key catalog for V1**

Mariage OS supports project-defined custom criteria, but V1 must seed a stable set of commonly used wedding criteria so imports, comparisons and UI do not invent incompatible keys.

Keys are English snake_case machine identifiers. Labels are localized in the UI.

Priority is configurable per project. Defaults below reflect the current product use case, not a universal rule for every wedding.

Value states still distinguish `unknown`, known value, `not_applicable` and `conflict`.

---

# Venue criteria

## Capacity and room configuration

| Key | Type/unit | Default priority | Purpose |
|---|---|---|---|
| `capacity_seated_advertised` | number people | important | commercial advertised seated capacity |
| `capacity_cocktail_advertised` | number people | informational | cocktail capacity |
| `main_room_area_m2` | number m² | important | principal reception space area |
| `main_room_length_m` | number m | important | usable dimension |
| `main_room_width_m` | number m | important | usable dimension |
| `main_room_height_m` | number m | bonus | ceiling height |
| `single_large_reception_room` | boolean | blocking | one shared principal room rather than split rooms |
| `target_guest_count_supported` | boolean | blocking | supports configured wedding target range |
| `two_dance_areas_feasible` | boolean/assessment | blocking | two distinct dance areas in same shared room |
| `two_dance_areas_max_guest_estimate` | number people | important | couple-specific estimated comfortable max |
| `dance_area_total_m2_estimate` | number m² | informational | estimated dance space |
| `circulation_comfort` | rating/select | important | circulation around tables/zones |
| `central_columns_obstructive` | boolean | important | obstructive columns/pillars |
| `room_shape` | select/text | important | rectangular/long/narrow/irregular/etc. |

## Ceremony / religious configuration

| Key | Type | Default priority |
|---|---|---|
| `outdoor_chuppah_possible` | boolean | blocking |
| `outdoor_ceremony_location_quality` | rating | important |
| `indoor_ceremony_backup` | boolean | blocking |
| `mehitsa_possible` | boolean | blocking |
| `mehitsa_provided` | boolean | bonus |
| `mehitsa_fixing_constraints` | text | important |
| `ceremony_power_available` | boolean | bonus |
| `ceremony_accessible_pmr` | boolean | important |

## Catering and kitchen

| Key | Type | Default priority |
|---|---|---|
| `external_caterer_allowed` | boolean | blocking |
| `exclusive_caterer` | boolean | blocking-negative |
| `approved_caterer_list_required` | boolean | important |
| `kosher_caterer_previously_hosted` | boolean | bonus |
| `caterer_access_fee_minor` | money | important |
| `corkage_fee_minor` | money | important |
| `professional_kitchen_available` | boolean | important |
| `kitchen_area_m2` | number m² | informational |
| `cold_storage_available` | boolean | important |
| `freezer_available` | boolean | bonus |
| `cooking_on_site_allowed` | boolean | important |
| `open_flame_allowed` | boolean | important |
| `caterer_delivery_access` | rating/select | important |
| `caterer_setup_time_hours` | duration | important |

## Weather / seasonal resilience

| Key | Type | Default priority |
|---|---|---|
| `full_rain_plan` | boolean | blocking |
| `rain_plan_same_quality` | rating | important |
| `cocktail_indoor_backup` | boolean | important |
| `winter_suitable` | boolean | important |
| `summer_heat_suitable` | boolean | important |
| `air_conditioning` | boolean | important |
| `heating` | boolean | important |
| `natural_ventilation` | boolean | bonus |
| `outdoor_shade` | rating | bonus |
| `covered_outdoor_space` | boolean | bonus |
| `wind_exposure` | rating/select | informational |
| `rain_ground_mud_risk` | rating/select | informational |

## Aesthetics and atmosphere

| Key | Type | Default priority |
|---|---|---|
| `interior_aesthetic_score` | rating /10 | important |
| `exterior_aesthetic_score` | rating /10 | important |
| `view_score` | rating /10 | important |
| `overall_atmosphere_score` | rating /10 | important |
| `elevated_location` | boolean | important |
| `panoramic_view` | boolean | important |
| `natural_light` | rating | important |
| `large_windows_or_glazing` | boolean | bonus |
| `authentic_character` | rating | important |
| `canteen_event_hall_risk` | rating/select | important-negative |
| `decoration_effort_required` | select low/medium/high | important |
| `stone_architecture` | boolean | bonus |
| `wood_beams` | boolean | bonus |
| `provence_style` | boolean | bonus |
| `park_garden_quality` | rating | bonus |

## Music / technical

| Key | Type | Default priority |
|---|---|---|
| `music_end_time` | time/local convention | important |
| `sound_limiter_present` | boolean | important |
| `sound_limit_db` | number dB | important |
| `doors_close_for_music_at` | time | important |
| `soundproofing_quality` | rating/select | important |
| `dj_sound_system_included` | boolean | bonus |
| `microphone_included` | boolean | bonus |
| `lighting_system_included` | boolean | bonus |
| `three_phase_power_available` | boolean | informational |
| `backup_generator_available` | boolean | bonus |
| `wifi_available` | boolean | informational |

## Furniture / included package

| Key | Type | Default priority |
|---|---|---|
| `tables_included` | boolean | important |
| `tables_round_count` | number | informational |
| `tables_rectangular_count` | number | informational |
| `chairs_included` | boolean | important |
| `chairs_count` | number | informational |
| `linens_included` | boolean | important |
| `tableware_included` | boolean | important |
| `glassware_included` | boolean | important |
| `cocktail_furniture_included` | boolean | bonus |
| `high_tables_count` | number | informational |
| `cloakroom_available` | boolean | bonus |
| `cleaning_included` | boolean | important |
| `security_staff_included` | boolean | important |
| `venue_coordinator_included` | boolean | bonus |
| `basic_decoration_included` | boolean | bonus |
| `flowers_included` | boolean | bonus |

## Access and logistics

| Key | Type | Default priority |
|---|---|---|
| `driving_duration_from_reference` | duration | important |
| `distance_from_reference_km` | distance km | informational |
| `nearest_tgv_station` | text | important |
| `tgv_station_transfer_duration` | duration | important |
| `public_transport_from_station` | boolean | bonus |
| `taxi_vtc_feasibility` | rating/select | important |
| `shuttle_feasibility` | rating/select | important |
| `coach_access` | boolean | important |
| `parking_available` | boolean | important |
| `parking_capacity_cars` | number | informational |
| `parking_walk_duration` | duration | informational |
| `parking_lit` | boolean | bonus |
| `pmr_access` | boolean | important |
| `nearest_airport` | text | informational |
| `airport_transfer_duration` | duration | informational |

## Accommodation / weekend

| Key | Type | Default priority |
|---|---|---|
| `accommodation_on_site` | boolean | bonus |
| `on_site_bed_count_advertised` | number | informational |
| `comfortable_bed_count_estimate` | number | informational |
| `nearby_hotels_quality` | rating/select | bonus |
| `nearby_hotel_rooms_estimate` | number | informational |
| `minimum_stay_nights` | number | informational |
| `breakfast_available` | boolean | bonus |
| `next_day_brunch_possible` | boolean | bonus |
| `checkout_time` | time | informational |

## Facilities

| Key | Type | Default priority |
|---|---|---|
| `toilet_count` | number | important |
| `pmr_toilet` | boolean | important |
| `baby_changing_facility` | boolean | informational |
| `swimming_pool` | boolean | bonus |
| `private_getting_ready_room` | boolean | bonus |
| `storage_room_available` | boolean | bonus |

## Commercial / contract

| Key | Type | Default priority |
|---|---|---|
| `venue_hire_price_reference_minor` | money | important |
| `deposit_percentage` | number % | important |
| `security_deposit_minor` | money | important |
| `cancellation_terms_checked` | boolean | important |
| `postponement_terms_checked` | boolean | important |
| `insurance_required` | boolean | important |
| `final_guest_count_deadline_days` | number days | important |
| `exclusive_vendor_constraints` | text | important |
| `quote_requested` | boolean | important |
| `quote_received` | boolean | important |
| `visit_completed` | boolean | important |

Many commercial state values also have dedicated structured entities. These criteria exist only where a comparison flag is useful; source-of-truth commercial amounts remain in offers/contracts/payments rather than duplicated fact values.

---

# Caterer/vendor default criteria

## Caterer service/content

| Key | Type | Default priority |
|---|---|---|
| `kosher_certification_or_supervision` | text/select | important |
| `compatible_with_required_kashrut` | boolean | blocking |
| `price_per_adult_minor` | money | important |
| `price_per_child_minor` | money | informational |
| `minimum_guest_count` | number | important |
| `cocktail_included` | boolean | important |
| `meal_included` | boolean | important |
| `buffet_available` | boolean | important |
| `table_service_available` | boolean | bonus |
| `veal_available` | boolean | bonus |
| `lamb_available` | boolean | bonus |
| `wine_included` | boolean | important |
| `champagne_included` | boolean | important |
| `soft_drinks_included` | boolean | important |
| `cake_included` | boolean | important |
| `servers_included` | boolean | important |
| `server_count` | number | informational |
| `tableware_included` | boolean | important |
| `glassware_included` | boolean | important |
| `linens_included` | boolean | important |
| `setup_included` | boolean | important |
| `cleanup_included` | boolean | important |
| `travel_fee_minor` | money | important |
| `kitchen_equipment_brought` | boolean | bonus |
| `tasting_available` | boolean | bonus |
| `tasting_price_minor` | money | informational |
| `late_night_food_available` | boolean | bonus |
| `brunch_next_day_available` | boolean | bonus |

## Vendor reliability/process

| Key | Type | Default priority |
|---|---|---|
| `quote_requested` | boolean | important |
| `quote_received` | boolean | important |
| `response_speed_rating` | rating | bonus |
| `quote_clarity_rating` | rating | important |
| `communication_rating` | rating | important |
| `recent_review_score` | rating | informational |
| `reliability_risk` | select low/medium/high | important |
| `backup_plan_if_unavailable` | boolean/text | important depending vendor type |

---

# Personal couple ratings

Partner-specific ratings should generally not use shared factual retained-value semantics. Store each member's rating independently for dimensions such as:

- `love_score`;
- `interior_aesthetic_score_personal`;
- `exterior_aesthetic_score_personal`;
- `logistics_score_personal`;
- `value_for_money_score_personal`.

Shared factual criteria and individual opinions must not overwrite one another.

---

# Criterion creation rules

Custom criteria can be added from UI/import with:

- stable generated key;
- label;
- entity type;
- value type;
- unit/options;
- priority/weight;
- freshness policy.

Before import creates a new definition, preview possible semantic duplicates against existing keys/labels.

System-defined keys cannot be silently repurposed to a different semantic/type.

---

# Import contract

Canonical imports should reference these stable keys whenever semantics match. ChatGPT-generated venue research imports should prefer these keys over inventing synonyms.

If source data uses a different column label, mapping translates it to the stable criterion key.
