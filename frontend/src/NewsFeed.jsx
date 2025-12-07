import React, { useEffect, useState, useRef } from "react";

const API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);

  // LAST 7 DAYS
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);

  const format = (d) => d.toISOString().split("T")[0];
  const FROM = format(lastWeek);
  const TO = format(today);

  useEffect(() => {
    // Force video play
    if (videoRef.current) {
      videoRef.current
        .play()
        .catch((err) => console.log("Autoplay prevented:", err));
    }
  }, []);

  useEffect(() => {
    if (!API_KEY) {
      console.error("❌ Missing API key");
      setLoading(false);
      return;
    }

    const url = `https://gnews.io/api/v4/search?q=air+quality+OR+pollution+OR+climate&lang=en&from=${FROM}&to=${TO}&max=20&apikey=${API_KEY}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setArticles((data.articles || []).slice(0, 20));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div
        style={{
          padding: 20,
          color: "white",
          background: "#111",
          minHeight: "100vh",
        }}
      >
        <h2>Fetching latest news…</h2>
      </div>
    );

  return (
    <>
      {/* 🔥 FULLSCREEN BACKGROUND VIDEO */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.55)",
          zIndex: 1,
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "20px 20px 30px 20px",
          color: "white",
          width: "100%",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            position: "sticky",
            top: "10px",
            zIndex: 50,
            fontSize: "56px",
            fontWeight: "900",
            margin: "60px 0 40px 0",
            padding: "25px 20px",
            textAlign: "center",
            textTransform: "uppercase",
            letterSpacing: "4px",
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
            backdropFilter: "blur(15px)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            borderRadius: "0px",
          }}
        >
          <span
            style={{
              textShadow:
                "0 0 30px rgba(102, 126, 234, 0.5), 0 0 60px rgba(118, 75, 162, 0.3)",
              WebkitTextFillColor: "white",
              display: "block",
            }}
          >
            📰 UPDATES ON AQI AND CLIMATE CHANGE
          </span>
        </h1>

        {/* News cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "25px",
            width: "100%",
            maxWidth: "1400px",
            margin: "0 auto",
          }}
        >
          {articles.map((a, i) => (
            <div
              key={i}
              onClick={() => window.open(a.url, "_blank")}
              style={{
                cursor: "pointer",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(12px)",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 8px 18px rgba(0,0,0,0.5)",
                transition: "0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-10px) scale(1.03)";
                e.currentTarget.style.boxShadow = "0 12px 28px rgba(0,0,0,0.7)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.5)";
              }}
            >
              {a.image && (
                <img
                  src={a.image}
                  alt=""
                  style={{
                    width: "100%",
                    height: "190px",
                    objectFit: "cover",
                  }}
                />
              )}

              <div style={{ padding: "18px" }}>
                <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>
                  {a.title}
                </h2>

                <p
                  style={{
                    color: "#ddd",
                    fontSize: "14px",
                    marginBottom: "12px",
                  }}
                >
                  {(a.description || "").slice(0, 120)}...
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#bbb", fontSize: "13px" }}>
                    {a.source?.name}
                  </span>

                  <button
                    style={{
                      padding: "6px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "white",
                      fontSize: "13px",
                    }}
                  >
                    Read More →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NewsFeed;
