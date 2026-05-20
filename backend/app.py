from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

# ─── Yardımcı fonksiyonlar ───────────────────────────────────────────────────

def safe_int(v):
    try:
        s = str(v).strip().replace(".", "").replace(",", "").replace("%", "").replace(" ", "")
        if s in ("", "nan", "-", "None"):
            return 0
        return int(float(s))
    except (ValueError, TypeError):
        return 0

def pct_to_float(val):
    """'117%' → 117.0,  '-' → None"""
    if pd.isna(val):
        return None
    s = str(val).strip().replace("%", "").replace(",", ".")
    if s in ("-", "", "nan", "None"):
        return None
    try:
        return round(float(s), 1)
    except ValueError:
        return None

MONTH_ORDER = ["January", "February", "March", "April", "May", "June",
               "July", "August", "September", "October", "Nowember", "December"]

# ─── /api/overview ──────────────────────────────────────────────────────────

@app.route("/api/overview")
def overview():
    path = os.path.join(DATA_DIR, "2024_Aylık_Markanın_Toplam_Satışları.csv")
    df = pd.read_csv(path, sep=";", header=None, encoding="utf-8-sig")

    # Satır 2 = BRAND-A  → col1=2024 YTD, col2=2025 YTD
    # Satır 5 = ay başlıkları (JAN'24 …)
    # Satır 6 = TARGET
    # Satır 7 = TARGET ACHIEVEMENT

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
              "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    target_row = df.iloc[6]   # row index 6
    actual_row = df.iloc[7]   # row index 7

    data = []
    for i, m in enumerate(months):
        t = target_row.iloc[i + 1]
        a = actual_row.iloc[i + 1]
        data.append({
            "month": m,
            "target": safe_int(t),
            "actual": safe_int(a),
        })

    brand_row = df.iloc[2]
    total_2024 = safe_int(brand_row.iloc[1])
    total_2025 = safe_int(brand_row.iloc[2])

    return jsonify({
        "monthly": data,
        "ytd": {"2024": total_2024, "2025": total_2025}
    })

# ─── /api/dealers/full-year ─────────────────────────────────────────────────

@app.route("/api/dealers/full-year")
def dealers_full_year():
    result = {}

    # ── 2024 ──
    path24 = os.path.join(DATA_DIR, "2024_BRAND-A_Bayilerin_Hedef_Gerçekleştirme_Full_Year.csv")
    df24 = pd.read_csv(path24, sep=";", encoding="utf-8-sig", header=None)
    dealers24 = []
    for _, row in df24.iterrows():
        code = str(row.iloc[0]).strip()
        if not code.startswith("BA-"):
            continue
        target   = safe_int(row.iloc[2])
        allSales = safe_int(row.iloc[3])
        b2b      = safe_int(row.iloc[4])
        b2c      = safe_int(row.iloc[5])
        # Gerçek hedef gerçekleştirme = allSales / hedef * 100
        achievement = round(allSales / target * 100, 1) if target > 0 else None
        dealers24.append({
            "code": code,
            "name": str(row.iloc[1]).strip(),
            "target":      target,
            "allSales":    allSales,
            "b2b":         b2b,
            "b2c":         b2c,
            "achievement": achievement,
        })
    result["2024"] = dealers24

    # ── 2025 ──
    # Kolon düzeni (row index 1 = header):
    # 0=DEALER CODE, 1=DEALER NAME, 2=%, 3=HEDEF(target)
    # B2C blok: 5=code, 6=name, 7=A1, 8=A2, 9=A3, 10=B1, 11=B2+C+D, 12=TOPLAM, 13=%
    # B2B blok: 15=code, 16=name, 17=A1, 18=A2, 19=A3, 20=B1, 21=B2+C+D, 22=TOPLAM
    path25 = os.path.join(DATA_DIR, "2025_BRAND-A_Bayilerin_Hedef_Gerçekleştirme_Full_Year.csv")
    df25 = pd.read_csv(path25, sep=";", encoding="utf-8-sig", header=None)
    dealers25 = []
    for _, row in df25.iterrows():
        code = str(row.iloc[0]).strip()
        if not code.startswith("BA-"):
            continue
        models = {
            "A1": safe_int(row.iloc[7]),
            "A2": safe_int(row.iloc[8]),
            "A3": safe_int(row.iloc[9]),
            "B1": safe_int(row.iloc[10]),
            "Other": safe_int(row.iloc[11]),
        }
        target = safe_int(row.iloc[3])
        b2c    = safe_int(row.iloc[12])
        b2b    = safe_int(row.iloc[22])
        # Gerçek hedef gerçekleştirme = b2c / hedef * 100
        achievement = round(b2c / target * 100, 1) if target > 0 else None
        dealers25.append({
            "code": code,
            "name": str(row.iloc[1]).strip(),
            "marketShare":    pct_to_float(row.iloc[2]),   # pazar payı (col2)
            "achievement":    achievement,                  # b2c/hedef*100
            "target":         target,
            "b2c":            b2c,
            "b2cAchievement": pct_to_float(row.iloc[13]),  # b2c % (col13)
            "b2b":            b2b,
            "models":         models,
        })
    result["2025"] = dealers25

    return jsonify(result)

# ─── /api/dealers/monthly ───────────────────────────────────────────────────

@app.route("/api/dealers/monthly")
def dealers_monthly():
    result = {}

    for year, fname in [
        ("2024", "BRAND-A_2024_Bayilerin_Aylık_Hedef_Gerçekleştirmeleri.csv"),
        ("2025", "BRAND-A_2025_Bayilerin_Aylık_Hedef_Gerçekleştirmeleri.csv"),
    ]:
        path = os.path.join(DATA_DIR, fname)
        df = pd.read_csv(path, sep=";", header=None, encoding="utf-8-sig")
        # Satır 1 = başlık (DEALER CODE, DEALER NAME, January, February, ...)
        # Satır 2+ = veri
        dealers = []
        for _, row in df.iloc[2:].iterrows():
            code = str(row.iloc[0]).strip()
            if not code.startswith("BA-"):
                continue
            monthly = {}
            for i, m in enumerate(MONTH_ORDER):
                monthly[m] = pct_to_float(row.iloc[i + 2])
            dealers.append({
                "code": code,
                "name": str(row.iloc[1]).strip(),
                "monthly": monthly,
                "fullYear": pct_to_float(row.iloc[14]),
            })
        result[year] = dealers

    return jsonify(result)

# ─── /api/models/monthly ────────────────────────────────────────────────────

@app.route("/api/models/monthly")
def models_monthly():
    month_files = {
        "January":   "BRAND-A_2025_JANUARY_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "February":  "BRAND-A_2025_ŞUBAT_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "March":     "BRAND-A_2025_MARCH_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "April":     "BRAND-A_2025_APRIL_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "May":       "BRAND-A_2025_MAY_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "June":      "BRAND-A_2025_JUNE_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "July":      "BRAND-A_2025_TEMMUZ_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "August":    "BRAND-A_2025_AUGUST_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "September": "BRAND-A_2025_SEPTEMBER_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "October":   "BRAND-A_2025_OCTOBER_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "November":  "BRAND-A_2025_NOWEMBER_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
        "December":  "BRAND-A_2025_DECEMBER_Bayinin_Aylık_Model_Bazlı_Araç_Satışı_Hedef_Gerçekleştirmesi.csv",
    }

    months_data = {}
    for month, fname in month_files.items():
        fpath = os.path.join(DATA_DIR, fname)
        if not os.path.exists(fpath):
            continue
        df = pd.read_csv(fpath, sep=";", header=None, encoding="utf-8-sig")

        dealers = []
        model_totals = {"A1": 0, "A2": 0, "A3": 0, "B1": 0, "Other": 0}
        b2c_target = 0
        b2c_actual = 0
        b2c_ach = None

        for _, row in df.iterrows():
            code = str(row.iloc[0]).strip()
            if code.startswith("BA-"):
                models = {
                    "A1":    safe_int(row.iloc[7]),
                    "A2":    safe_int(row.iloc[8]),
                    "A3":    safe_int(row.iloc[9]),
                    "B1":    safe_int(row.iloc[10]),
                    "Other": safe_int(row.iloc[11]),
                }
                dealers.append({
                    "code": code,
                    "name": str(row.iloc[1]).strip(),
                    "b2cTotal":    safe_int(row.iloc[12]),
                    "achievement": pct_to_float(row.iloc[13]),
                    "models":      models,
                })

            # Toplam satırı: col5 == "ACTUAL"
            if str(row.iloc[5]).strip() == "ACTUAL":
                for mi, mc in enumerate(["A1", "A2", "A3", "B1", "Other"]):
                    model_totals[mc] = safe_int(row.iloc[7 + mi])
                b2c_actual = safe_int(row.iloc[12])
                b2c_ach = pct_to_float(row.iloc[13])

            if str(row.iloc[5]).strip() == "TARGET":
                b2c_target = safe_int(row.iloc[12])

        months_data[month] = {
            "dealers":      dealers,
            "modelTotals":  model_totals,
            "b2cTarget":    b2c_target,
            "b2cActual":    b2c_actual,
            "b2cAchievement": b2c_ach,
        }

    return jsonify(months_data)

# ─── /api/vehicles ──────────────────────────────────────────────────────────

@app.route("/api/vehicles")
def vehicles():
    path = os.path.join(DATA_DIR, "2025_Satılan_Araç_Bilgileri_v3(tamamlanmış hali).csv")
    df = pd.read_csv(path, sep=";", encoding="utf-8-sig", low_memory=False)

    # Aylık satış trendi
    df["_date"] = pd.to_datetime(
        df["Sales Date"].astype(str).str.split(" ").str[0],
        format="%d.%m.%Y", errors="coerce"
    )
    df["_month"] = df["_date"].dt.to_period("M").astype(str)
    monthly_sales = df.groupby("_month").size().sort_index().to_dict()

    # Model dağılımı
    model_counts = df["Model Description"].value_counts().to_dict()

    # Kanal dağılımı
    channel_counts = df["Channel Description"].value_counts().to_dict()

    # Şehir dağılımı (top 15)
    city_counts = df["City"].value_counts().head(15).to_dict()

    # Renk dağılımı (top 10)
    color_counts = df["Exterior Color"].value_counts().head(10).to_dict()

    # Satış tipi
    sales_type_counts = df["Sales Type Description"].value_counts().to_dict()

    # Model yılı
    model_year_counts = {str(k): int(v) for k, v in df["Model Year"].value_counts().to_dict().items()}

    # Renk tipi (Color / Bicolor)
    color_type_counts = df["Exterior Color Type"].value_counts().to_dict()

    # Bayi bazlı satış sayısı
    dealer_sales = df.groupby("Dealer Name").size().sort_values(ascending=False).to_dict()

    # Bölge dağılımı
    zone_counts = df["Zone Name"].value_counts().to_dict()

    return jsonify({
        "totalVehicles":       len(df),
        "channelDistribution": channel_counts,
        "modelDistribution":   model_counts,
        "colorDistribution":   color_counts,
        "cityDistribution":    city_counts,
        "monthlySalesTrend":   monthly_sales,
        "dealerSalesCount":    dealer_sales,
        "salesTypeDistribution": sales_type_counts,
        "modelYearDistribution": model_year_counts,
        "colorTypeDistribution": color_type_counts,
        "zoneDistribution":    zone_counts,
    })

# ─── /api/dealer-locations ──────────────────────────────────────────────────

@app.route("/api/dealer-locations")
def dealer_locations():
    """Bayi koordinatları + 2025 performans verisi birleşik."""
    loc_path = os.path.join(DATA_DIR, "Dealer-Location.xlsx")
    loc_df = pd.read_excel(loc_path)

    # 2025 full year dealer verisi
    fy_path = os.path.join(DATA_DIR, "2025_BRAND-A_Bayilerin_Hedef_Gerçekleştirme_Full_Year.csv")
    fy_df = pd.read_csv(fy_path, sep=";", encoding="utf-8-sig", header=None)

    # Bayi performans sözlüğü: name → {achievement, b2c, target}
    perf = {}
    for _, row in fy_df.iterrows():
        code = str(row.iloc[0]).strip()
        if not code.startswith("BA-"):
            continue
        name = str(row.iloc[1]).strip()
        perf[name] = {
            "code":        code,
            "achievement": pct_to_float(row.iloc[2]),
            "target":      safe_int(row.iloc[3]),
            "b2c":         safe_int(row.iloc[12]),
            "b2b":         safe_int(row.iloc[22]),
        }

    dealers = []
    for _, row in loc_df.iterrows():
        name = str(row["DEALER NAME"]).strip()
        loc  = str(row["LOCATION"]).strip()
        try:
            lat, lng = [float(x.strip()) for x in loc.split(",")]
        except Exception:
            continue
        entry = {"name": name, "lat": lat, "lng": lng}
        if name in perf:
            entry.update(perf[name])
        dealers.append(entry)

    return jsonify(dealers)


# ─── /api/all-sales ─────────────────────────────────────────────────────────

@app.route("/api/all-sales")
def all_sales():
    """2024-2025 birleşik satış verisi — yıl karşılaştırması."""
    path = os.path.join(DATA_DIR, "2024-2025-tüm-satışlar.csv")
    df = pd.read_csv(path, sep=";", encoding="utf-8-sig", low_memory=False)

    # Yıl kolonunu çıkar
    df["_date"] = pd.to_datetime(df["Sales Date"].astype(str).str[:10], errors="coerce")
    df["_year"]  = df["_date"].dt.year.astype("Int64").astype(str)
    df["_month"] = df["_date"].dt.month.astype("Int64")

    AY = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]

    # Aylık satış trendi (2024 vs 2025)
    monthly = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        counts = ydf.groupby("_month").size()
        monthly[year] = {AY[int(m)-1]: int(v) for m, v in counts.items() if 1 <= int(m) <= 12}

    # Model bazlı yıl karşılaştırması
    model_year = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        model_year[year] = ydf["Model Description"].value_counts().to_dict()

    # Kanal bazlı yıl karşılaştırması
    channel_year = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        channel_year[year] = ydf["Channel Description"].value_counts().to_dict()

    # Şehir bazlı yıl karşılaştırması (top 12)
    city_year = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        city_year[year] = ydf["City"].value_counts().head(12).to_dict()

    # Bayi bazlı yıl karşılaştırması
    dealer_year = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        dealer_year[year] = ydf["Dealer Name"].value_counts().to_dict()

    # Renk dağılımı karşılaştırması (top 8)
    color_year = {}
    for year in ["2024", "2025"]:
        ydf = df[df["_year"] == year]
        color_year[year] = ydf["Exterior Color"].value_counts().head(8).to_dict()

    # Toplam satışlar
    totals = {year: int((df["_year"] == year).sum()) for year in ["2024", "2025"]}

    return jsonify({
        "totals":      totals,
        "monthly":     monthly,
        "modelYear":   model_year,
        "channelYear": channel_year,
        "cityYear":    city_year,
        "dealerYear":  dealer_year,
        "colorYear":   color_year,
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
