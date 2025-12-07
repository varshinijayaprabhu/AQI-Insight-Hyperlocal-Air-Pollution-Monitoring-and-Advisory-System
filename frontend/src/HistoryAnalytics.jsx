// src/HistoryAnalytics.jsx
import React, { useEffect, useState } from "react";

/* ====== PENGUIN GIFS ====== */
import pengHappy from "./assets/peng_happy.gif";
import pengNormal from "./assets/peng_normal.gif";
import pengConcerned from "./assets/peng_concerned.gif";
import pengSick from "./assets/peng_sick.gif";
import pengVerySick from "./assets/peng_very_sick.gif";
import pengDead from "./assets/peng_dead.gif";

/* ====== CONTACT GIF ====== */
import contactGif from "./assets/contact.gif";

// Contact Card Component
function ContactCard() {
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedTab, setSelectedTab] = React.useState("about");

  const contactInfo = {
    name: "Varshini Jayaprabhu",
    title: "Full-Stack Developer",
    email: "varshini.j.512004@gmail.com",
    linkedin: "https://www.linkedin.com/in/varshinij2004",
    github: "https://github.com/varshinijayaprabhu",
    location: "India",
  };

  const projects = [
    {
      name: "🔐 Organizational Chat",
      desc: "Real-time chat application for organizational collaboration",
      details:
        "A real-time chat application designed for organizational collaboration and internal communication with secure authentication and live message updates.",
      repo: "varshinijayaprabhu/Organizational-chat",
    },
    {
      name: "🌍 CO₂ Emission Predictor",
      desc: "Carbon emissions prediction using ML models",
      details:
        "Predicts carbon emissions using regression-based ML models to promote environmental sustainability and data-driven insights.",
      repo: "varshinijayaprabhu/CO2_emission_predictor",
    },
    {
      name: "🌫️ AQI Insight",
      desc: "Hyperlocal air pollution monitoring & advisory system",
      details:
        "An advanced dashboard for real-time AQI visualization and forecasting. Provides air-quality advisories for underserved regions using predictive ML models.",
      repo: "varshinijayaprabhu/AQI-Insight-Hyperlocal-Air-Pollution-Monitoring-and-Advisory-System",
    },
    {
      name: "🧩 Applicant Tracking System",
      desc: "Complete ATS with NLP-based resume parsing",
      details:
        "A complete ATS solution featuring role-based dashboards (Job Seeker, Recruiter, Admin). Includes resume upload, NLP-based parsing, and automatic ATS resume generation.",
      repo: "varshinijayaprabhu/applicant_tracking_system",
    },
    {
      name: "🧠 Mindsafe",
      desc: "Mental well-being support platform",
      details:
        "A mental well-being support platform integrating chat, progress tracking, and safety alerts — helping users maintain emotional balance and mindfulness.",
      repo: "varshinijayaprabhu/Mindsafe",
    },
  ];

  return (
    <>
      {/* Collapsed Card View */}
      {!showDetails && (
        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <div
              style={{
                background: "rgba(20,20,28,0.94)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(56, 189, 248, 0.4)",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <video
                src="/cloud.mp4"
                autoPlay
                loop
                muted
                playsInline
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  opacity: 0.12,
                  pointerEvents: "none",
                  zIndex: 0,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, rgba(10,12,18,0.6) 0%, rgba(10,12,18,0.85) 100%)",
                  zIndex: 1,
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    cursor: "pointer",
                  }}
                  onClick={() => setShowDetails(true)}
                >
                  <div
                    style={{
                      fontSize: 28,
                      fontWeight: "bold",
                      background:
                        "linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    👋 Hi, I'm Varshini!
                  </div>
                  <div
                    style={{
                      width: 160,
                      height: 160,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "3px solid rgba(168, 85, 247, 0.5)",
                      boxShadow:
                        "0 0 20px rgba(168, 85, 247, 0.3), inset 0 0 15px rgba(56, 189, 248, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(56, 189, 248, 0.1)",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <img
                      src={contactGif}
                      alt="Contact"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      opacity: 0.8,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.9)",
                      fontWeight: "500",
                    }}
                  >
                    Full-Stack Developer | Open Source Enthusiast
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      opacity: 0.6,
                      textAlign: "center",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    Click to view projects & contact details
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Modal View */}
      {showDetails && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: 20,
          }}
          onClick={() => setShowDetails(false)}
        >
          <div
            style={{
              background: "rgba(20,20,28,0.98)",
              backdropFilter: "blur(15px)",
              border: "2px solid rgba(168, 85, 247, 0.4)",
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
              maxWidth: "900px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: 20,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background:
                  "linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(56,189,248,0.1) 100%)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    background:
                      "linear-gradient(90deg, #38BDF8 0%, #A78BFA 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {contactInfo.name}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                  }}
                >
                  {contactInfo.title}
                </div>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 20,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                }}
              >
                ✕
              </button>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: 0,
                padding: "0 20px",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              {["about", "projects", "contact"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  style={{
                    padding: "12px 20px",
                    background:
                      selectedTab === tab
                        ? "rgba(168, 85, 247, 0.3)"
                        : "transparent",
                    border: "none",
                    borderBottom:
                      selectedTab === tab
                        ? "2px solid rgba(168, 85, 247, 0.8)"
                        : "2px solid transparent",
                    color:
                      selectedTab === tab ? "#A78BFA" : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: "600",
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTab !== tab)
                      e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTab !== tab)
                      e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  {tab === "about" && "👤 About"}
                  {tab === "projects" && "🚀 Projects"}
                  {tab === "contact" && "📞 Contact"}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                padding: 24,
              }}
            >
              {selectedTab === "about" && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr",
                    gap: 24,
                    alignItems: "start",
                  }}
                >
                  <div
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "2px solid rgba(168, 85, 247, 0.4)",
                      boxShadow: "0 8px 25px rgba(168, 85, 247, 0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(56, 189, 248, 0.1)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={contactGif}
                      alt="Varshini"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: "bold",
                          color: "#38BDF8",
                          marginBottom: 8,
                        }}
                      >
                        About Me
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.8)",
                          lineHeight: 1.6,
                        }}
                      >
                        Hi! I'm Varshini Jayaprabhu, a passionate full-stack
                        developer dedicated to building innovative solutions for
                        real-world problems. I specialize in creating
                        applications that combine clean code with exceptional
                        user experiences. My projects focus on sustainability,
                        healthcare, and organizational efficiency.
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                      {[
                        "React",
                        "Python",
                        "Node.js",
                        "Machine Learning",
                        "FastAPI",
                        "Full-Stack",
                      ].map((skill) => (
                        <div
                          key={skill}
                          style={{
                            padding: "6px 12px",
                            background: "rgba(168, 85, 247, 0.15)",
                            border: "1px solid rgba(168, 85, 247, 0.4)",
                            borderRadius: 6,
                            fontSize: 11,
                            color: "#A78BFA",
                            fontWeight: "600",
                          }}
                        >
                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedTab === "projects" && (
                <div style={{ display: "grid", gap: 16 }}>
                  {projects.map((project, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10,
                        padding: 16,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)";
                        e.currentTarget.style.borderColor =
                          "rgba(168, 85, 247, 0.4)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.05)";
                        e.currentTarget.style.borderColor =
                          "rgba(255,255,255,0.1)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: "bold",
                          color: "#38BDF8",
                          marginBottom: 6,
                        }}
                      >
                        {project.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.7)",
                          marginBottom: 8,
                        }}
                      >
                        {project.desc}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgba(255,255,255,0.6)",
                          lineHeight: 1.5,
                          marginBottom: 10,
                        }}
                      >
                        {project.details}
                      </div>
                      <a
                        href={`https://github.com/${project.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11,
                          color: "#FCD34D",
                          textDecoration: "none",
                          fontWeight: "600",
                          display: "inline-block",
                          padding: "6px 10px",
                          background: "rgba(253, 211, 77, 0.15)",
                          border: "1px solid rgba(253, 211, 77, 0.3)",
                          borderRadius: 4,
                        }}
                      >
                        View on GitHub →
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {selectedTab === "contact" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "grid", gap: 12 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.6,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          fontWeight: "600",
                          color: "#A78BFA",
                        }}
                      >
                        📧 Email
                      </div>
                      <a
                        href={`mailto:${contactInfo.email}`}
                        style={{
                          fontSize: 13,
                          color: "#38BDF8",
                          textDecoration: "none",
                          padding: "8px 12px",
                          background: "rgba(56, 189, 248, 0.1)",
                          border: "1px solid rgba(56, 189, 248, 0.3)",
                          borderRadius: 6,
                          display: "inline-block",
                        }}
                      >
                        {contactInfo.email}
                      </a>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          opacity: 0.6,
                          marginBottom: 4,
                          textTransform: "uppercase",
                          fontWeight: "600",
                          color: "#A78BFA",
                        }}
                      >
                        📍 Location
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgba(255,255,255,0.8)",
                          padding: "8px 12px",
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6,
                          display: "inline-block",
                        }}
                      >
                        {contactInfo.location}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.1)",
                      paddingTop: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.6,
                        marginBottom: 12,
                        textTransform: "uppercase",
                        fontWeight: "600",
                        color: "#A78BFA",
                      }}
                    >
                      🔗 Connect With Me
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 10,
                      }}
                    >
                      <a
                        href={contactInfo.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "10px 14px",
                          background: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid rgba(168, 85, 247, 0.4)",
                          borderRadius: 6,
                          color: "#A78BFA",
                          textDecoration: "none",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(168, 85, 247, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(168, 85, 247, 0.15)";
                        }}
                      >
                        LinkedIn
                      </a>
                      <a
                        href={contactInfo.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "10px 14px",
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          borderRadius: 6,
                          color: "#38BDF8",
                          textDecoration: "none",
                          textAlign: "center",
                          fontSize: 12,
                          fontWeight: "600",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "rgba(56, 189, 248, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "rgba(56, 189, 248, 0.15)";
                        }}
                      >
                        GitHub
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Improved Line Chart Component
function LineChart({ data, dataKey, label, color, height = 250 }) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          opacity: 0.5,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: "bold", color: color }}>
          {label}
        </div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
          No data available
        </div>
      </div>
    );
  }

  // Get values with their timestamps
  const dataPoints = data
    .map((d, i) => ({
      value: d[dataKey],
      timestamp: d.timestamp,
      index: i,
    }))
    .filter((d) => d.value != null);

  if (dataPoints.length === 0) {
    return (
      <div
        style={{
          background: "rgba(255,255,255,0.03)",
          padding: 20,
          borderRadius: 12,
          marginBottom: 20,
          opacity: 0.5,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: "bold", color: color }}>
          {label}
        </div>
        <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
          No {dataKey} data available in {data.length} records
        </div>
      </div>
    );
  }

  const values = dataPoints.map((d) => d.value);
  const maxVal = Math.max(...values);
  const minVal = Math.min(...values);
  const range = maxVal - minVal || 1;
  const avgVal = values.reduce((a, b) => a + b, 0) / values.length;

  // SVG dimensions with more space
  const svgWidth = 800;
  const svgHeight = 300;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 50;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Generate points for the line
  const points = dataPoints.map((dp, i) => {
    const x = paddingLeft + (i / (dataPoints.length - 1 || 1)) * chartWidth;
    const y =
      paddingTop + chartHeight - ((dp.value - minVal) / range) * chartHeight;
    return { x, y, value: dp.value, timestamp: dp.timestamp };
  });

  const pathData = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;

  // Calculate nice Y-axis ticks
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minVal + (range * i) / (yTicks - 1);
  });

  // Show fewer time labels to avoid congestion
  const maxTimeLabels = 8;
  const timeStep = Math.ceil(dataPoints.length / maxTimeLabels);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        border: `1px solid ${color}33`,
      }}
    >
      {/* Background Video for this graph */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          opacity: 0.15,
          borderRadius: 12,
        }}
      >
        <source src="/cloud.mp4" type="video/mp4" />
      </video>

      {/* Content overlay */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: "bold", color: color }}>
            {label}
          </div>
          <div style={{ fontSize: 13, opacity: 0.7 }}>
            <span style={{ color: "#4ADE80" }}>Min: {minVal.toFixed(1)}</span>
            <span style={{ margin: "0 12px", color: "#818CF8" }}>
              Avg: {avgVal.toFixed(1)}
            </span>
            <span style={{ color: "#F472B6" }}>Max: {maxVal.toFixed(1)}</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: "100%", height: "auto", minHeight: "200px" }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Y-axis grid lines and labels */}
          {yTickValues.map((tickValue, i) => {
            const y =
              paddingTop +
              chartHeight -
              ((tickValue - minVal) / range) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fontSize="12"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="end"
                >
                  {tickValue.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X-axis */}
          <line
            x1={paddingLeft}
            y1={svgHeight - paddingBottom}
            x2={svgWidth - paddingRight}
            y2={svgHeight - paddingBottom}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Y-axis */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={svgHeight - paddingBottom}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
          />

          {/* Area under curve */}
          <path
            d={`${pathData} L ${points[points.length - 1].x},${
              svgHeight - paddingBottom
            } L ${paddingLeft},${svgHeight - paddingBottom} Z`}
            fill={color}
            fillOpacity="0.15"
          />

          {/* Main line */}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => {
            // Show dots less frequently for clarity
            if (
              i % Math.max(1, Math.floor(points.length / 30)) === 0 ||
              i === points.length - 1
            ) {
              return (
                <g key={i}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    fill={color}
                    opacity="0.9"
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth="2"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="white"
                    opacity="0.8"
                  />
                </g>
              );
            }
            return null;
          })}

          {/* Time labels on X-axis */}
          {points.map((point, i) => {
            if (i % timeStep === 0 || i === points.length - 1) {
              const date = new Date(point.timestamp);
              const timeLabel = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
              return (
                <text
                  key={i}
                  x={point.x}
                  y={svgHeight - paddingBottom + 20}
                  fontSize="11"
                  fill="rgba(255,255,255,0.6)"
                  textAnchor="middle"
                >
                  {timeLabel}
                </text>
              );
            }
            return null;
          })}
        </svg>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            opacity: 0.6,
            textAlign: "center",
          }}
        >
          {dataPoints.length} data points over{" "}
          {Math.ceil(
            (new Date(dataPoints[dataPoints.length - 1].timestamp) -
              new Date(dataPoints[0].timestamp)) /
              (1000 * 60 * 60 * 24)
          )}{" "}
          days
        </div>
      </div>
    </div>
  );
}

export default function HistoryAnalytics({
  lat,
  lon,
  days = 30,
  rolling_window = 5,
  radius_km = 10, // 10km radius for more specific location data
}) {
  const [loading, setLoading] = useState(false);
  const [series, setSeries] = useState([]);
  const [daily, setDaily] = useState([]);
  const [summary, setSummary] = useState(null);
  const [dataSource, setDataSource] = useState("");
  const [error, setError] = useState(null);

  // Validate inputs
  if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
    return (
      <div style={{ color: "white", padding: 12 }}>📍 Select location</div>
    );
  }

  // Fetch data
  useEffect(() => {
    if (!lat || !lon) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const [tsRes, dailyRes, sumRes] = await Promise.all([
          fetch(
            `http://127.0.0.1:8000/aqi/history/timeseries?lat=${lat}&lon=${lon}&days=${days}&rolling_window=${rolling_window}&radius_km=${radius_km}`
          ),
          fetch(
            `http://127.0.0.1:8000/aqi/history/daily?lat=${lat}&lon=${lon}&days=${days}&radius_km=${radius_km}`
          ),
          fetch(
            `http://127.0.0.1:8000/aqi/history/summary?lat=${lat}&lon=${lon}&days=${days}&radius_km=${radius_km}`
          ),
        ]);

        if (!tsRes.ok || !dailyRes.ok || !sumRes.ok) {
          throw new Error("API failed");
        }

        const ts = await tsRes.json();
        const daily_data = await dailyRes.json();
        const sum = await sumRes.json();

        console.log("📊 API Response:", {
          timeseries: ts,
          daily: daily_data,
          summary: sum,
        });

        if (mounted) {
          setSeries(ts.series || []);
          setDaily(daily_data.daily || []);
          setSummary(sum.summary || null);
          setDataSource(
            ts.source || daily_data.source || sum.source || "unknown"
          );

          console.log("✅ State updated:", {
            seriesLength: (ts.series || []).length,
            dailyLength: (daily_data.daily || []).length,
            hasSummary: !!sum.summary,
            source: ts.source,
            firstRecord: (ts.series || [])[0],
          });
        }
      } catch (e) {
        console.error("Error:", e);
        if (mounted) setError(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [lat, lon, days, rolling_window, radius_km]);

  // Render states
  if (error) {
    return <div style={{ color: "#ff6b6b", padding: 12 }}>❌ {error}</div>;
  }

  if (loading) {
    return (
      <div style={{ color: "white", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>
          ⏳ Loading Analytics...
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Fetching data from database within {radius_km}km radius
        </div>
      </div>
    );
  }

  if (!series.length && !daily.length) {
    return (
      <div style={{ color: "white", padding: 20, textAlign: "center" }}>
        <div style={{ fontSize: 18, marginBottom: 8 }}>
          📭 No Historical Data
        </div>
        <div style={{ fontSize: 12, opacity: 0.7 }}>
          No data found in database within {radius_km}km of this location for
          the last {days} days.
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginTop: 8 }}>
          Try a larger area or wait for scheduled data collection.
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div
      style={{
        color: "white",
        width: "100%",
      }}
    >
      {/* Content */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>
            📊 Historical Analytics
          </h3>
          <div
            style={{
              fontSize: 11,
              padding: "6px 12px",
              background: "rgba(59,130,246,0.2)",
              border: "1px solid rgba(59,130,246,0.5)",
              borderRadius: 8,
              color: "#60A5FA",
            }}
          >
            🌐 India AQI Grid Database
          </div>
        </div>

        {/* Stats Cards */}
        {summary && summary.stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                background: "rgba(99,102,241,0.15)",
                padding: 12,
                borderRadius: 10,
                textAlign: "center",
                border: "1px solid rgba(99,102,241,0.3)",
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.7 }}>Mean AQI</div>
              <div
                style={{ fontSize: 20, fontWeight: "bold", color: "#818CF8" }}
              >
                {summary.stats.aqi?.mean?.toFixed(0) || "N/A"}
              </div>
            </div>
            <div
              style={{
                background: "rgba(236,72,153,0.15)",
                padding: 12,
                borderRadius: 10,
                textAlign: "center",
                border: "1px solid rgba(236,72,153,0.3)",
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.7 }}>Max AQI</div>
              <div
                style={{ fontSize: 20, fontWeight: "bold", color: "#F472B6" }}
              >
                {summary.stats.aqi?.max || "N/A"}
              </div>
            </div>
            <div
              style={{
                background: "rgba(34,197,94,0.15)",
                padding: 12,
                borderRadius: 10,
                textAlign: "center",
                border: "1px solid rgba(34,197,94,0.3)",
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.7 }}>Avg PM2.5</div>
              <div
                style={{ fontSize: 20, fontWeight: "bold", color: "#4ADE80" }}
              >
                {summary.stats.pm25?.mean?.toFixed(1) || "N/A"}
              </div>
            </div>
            <div
              style={{
                background: "rgba(251,146,60,0.15)",
                padding: 12,
                borderRadius: 10,
                textAlign: "center",
                border: "1px solid rgba(251,146,60,0.3)",
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.7 }}>Avg PM10</div>
              <div
                style={{ fontSize: 20, fontWeight: "bold", color: "#FB923C" }}
              >
                {summary.stats.pm10?.mean?.toFixed(1) || "N/A"}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: 16, marginBottom: 16, opacity: 0.9 }}>
            📈 Trend Analysis
          </h4>

          {/* Row 1: AQI alone - full width */}
          <LineChart
            data={series}
            dataKey="aqi"
            label="🎯 AQI Score"
            color="#818CF8"
            height={200}
          />

          {/* Row 2: PM2.5 and PM10 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <LineChart
              data={series}
              dataKey="pm25"
              label="🌫️ PM2.5 Levels"
              color="#4ADE80"
              height={180}
            />
            <LineChart
              data={series}
              dataKey="pm10"
              label="💨 PM10 Levels"
              color="#FB923C"
              height={180}
            />
          </div>

          {/* Row 3: NO2 and SO2 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <LineChart
              data={series}
              dataKey="no2"
              label="🏭 NO₂ Levels"
              color="#F472B6"
              height={180}
            />
            <LineChart
              data={series}
              dataKey="so2"
              label="⚗️ SO₂ Levels"
              color="#A78BFA"
              height={180}
            />
          </div>

          {/* Row 4: CO and O3 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
            }}
          >
            <LineChart
              data={series}
              dataKey="co"
              label="🚗 CO Levels"
              color="#FCD34D"
              height={180}
            />
            <LineChart
              data={series}
              dataKey="o3"
              label="☀️ O₃ Levels"
              color="#60A5FA"
              height={180}
            />
          </div>
        </div>

        {/* Data Info */}
        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>
              {series.length}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Data Points</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>
              {daily.length}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Daily Averages</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{days}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Days Period</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>
              {radius_km}km
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Search Radius</div>
          </div>
        </div>

        {/* Location Info */}
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            fontSize: 11,
            opacity: 0.6,
            textAlign: "center",
          }}
        >
          📍 Location: {lat.toFixed(4)}°N, {lon.toFixed(4)}°E | Data fetched
          from India AQI grid database (scheduled data collection)
        </div>

        {/* Future Predictions Section */}
        <FuturePrediction series={series} summary={summary} />
      </div>
    </div>
  );
}

// Future Prediction Component
function FuturePrediction({ series, summary }) {
  if (!series || series.length < 5 || !summary) {
    return null;
  }

  // Calculate trend (simple linear regression on recent data)
  const recentData = series.slice(-10); // Last 10 data points
  const aqiValues = recentData.map((d) => d.aqi).filter((v) => v != null);

  if (aqiValues.length < 3) return null;

  // Calculate average change rate
  let totalChange = 0;
  for (let i = 1; i < aqiValues.length; i++) {
    totalChange += aqiValues[i] - aqiValues[i - 1];
  }
  const avgChange = totalChange / (aqiValues.length - 1);
  const currentAQI = aqiValues[aqiValues.length - 1];
  const predictedAQI = Math.max(0, currentAQI + avgChange * 3); // Predict 3 steps ahead

  // Determine trend direction
  const trend =
    avgChange > 2 ? "increasing" : avgChange < -2 ? "decreasing" : "stable";
  const trendColor =
    trend === "increasing"
      ? "#F87171"
      : trend === "decreasing"
      ? "#4ADE80"
      : "#FCD34D";
  const trendIcon =
    trend === "increasing" ? "📈" : trend === "decreasing" ? "📉" : "➡️";

  // Generate health recommendations based on predicted AQI
  const getRecommendations = (aqi) => {
    if (aqi <= 50) {
      return {
        level: "Good",
        color: "#4ADE80",
        advice: "Air quality is satisfactory. Perfect for outdoor activities.",
        actions: [
          "Enjoy outdoor exercises",
          "No precautions needed",
          "Ideal for sensitive groups",
        ],
        peng: pengHappy,
      };
    } else if (aqi <= 100) {
      return {
        level: "Moderate",
        color: "#FCD34D",
        advice: "Air quality is acceptable for most people.",
        actions: [
          "Limit prolonged outdoor exertion",
          "Monitor sensitive individuals",
          "Consider indoor activities during peak hours",
        ],
        peng: pengNormal,
      };
    } else if (aqi <= 150) {
      return {
        level: "Unhealthy for Sensitive Groups",
        color: "#FB923C",
        advice: "Sensitive groups should reduce outdoor exposure.",
        actions: [
          "Use air purifiers indoors",
          "Wear N95 masks outdoors",
          "Limit outdoor activities for children and elderly",
        ],
        peng: pengConcerned,
      };
    } else if (aqi <= 200) {
      return {
        level: "Unhealthy",
        color: "#F87171",
        advice: "Everyone may experience health effects.",
        actions: [
          "Stay indoors as much as possible",
          "Use air purifiers",
          "Wear N95/N99 masks when going out",
          "Avoid outdoor exercise",
        ],
        peng: pengSick,
      };
    } else if (aqi <= 300) {
      return {
        level: "Very Unhealthy",
        color: "#C084FC",
        advice: "Health alert: Everyone may experience serious effects.",
        actions: [
          "Avoid all outdoor activities",
          "Keep windows closed",
          "Use air purifiers continuously",
          "Seek medical help if experiencing symptoms",
        ],
        peng: pengVerySick,
      };
    } else {
      return {
        level: "Hazardous",
        color: "#E11D48",
        advice:
          "Health warning: Emergency conditions affecting entire population.",
        actions: [
          "Stay indoors at all times",
          "Seal windows and doors",
          "Use high-grade air purifiers",
          "Relocate if possible",
          "Emergency medical attention for symptoms",
        ],
        peng: pengDead,
      };
    }
  };

  const forecast = getRecommendations(predictedAQI);

  // Generate calendar data for current month
  const generateCalendarData = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    // Create map of dates to AQI values from series data
    const aqiByDate = {};
    series.forEach((item) => {
      if (item.timestamp && item.aqi != null) {
        const date = new Date(item.timestamp);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        aqiByDate[dateKey] = item.aqi;
      }
    });

    const calendar = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${month}-${day}`;
      calendar.push({
        day,
        aqi: aqiByDate[dateKey] || null,
      });
    }
    return calendar;
  };

  const getAQIColor = (aqi) => {
    if (!aqi) return "rgba(255,255,255,0.1)";
    if (aqi <= 50) return "#4ADE80";
    if (aqi <= 100) return "#FCD34D";
    if (aqi <= 150) return "#FB923C";
    if (aqi <= 200) return "#F87171";
    if (aqi <= 300) return "#C084FC";
    return "#E11D48";
  };

  const calendarData = generateCalendarData();
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentMonth = monthNames[new Date().getMonth()];

  const featureList = [
    {
      icon: "📍",
      title: "Hyperlocal AQI",
      desc: "Tap the map or search to fetch live AQI with fallbacks.",
    },
    {
      icon: "🔥",
      title: "Heatmap Overlay",
      desc: "Smooth AQI heatmap generated from backend analytics.",
    },
    {
      icon: "🌈",
      title: "Map Themes",
      desc: "Satellite, dark, light, neon, and terrain basemaps.",
    },
    {
      icon: "🧪",
      title: "Pollutant Breakdown",
      desc: "PM2.5, PM10, CO, NO₂, SO₂, O₃ details with AQI.",
    },
    {
      icon: "🤖",
      title: "Future Outlook",
      desc: "Forecast, actions, penguin status, and smoking equivalent.",
    },
    {
      icon: "📅",
      title: "AQI Calendar",
      desc: "Color-coded month view with hover hints and highlights.",
    },
    {
      icon: "📰",
      title: "Climate News",
      desc: "Curated AQI & climate headlines with immersive video backdrop.",
    },
    {
      icon: "🔔",
      title: "Smart Notices",
      desc: "Inline toasts for searches, geolocation, and status updates.",
    },
  ];

  return (
    <div style={{ marginTop: 20 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          alignItems: "start",
        }}
      >
        {/* Prediction Card */}
        <div
          style={{
            background: "rgba(20,20,28,0.94)",
            backdropFilter: "blur(12px)",
            padding: 6,
            borderRadius: 10,
            border: "2px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            minHeight: "320px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <video
            src="/cloud.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.18,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.8) 100%)",
              zIndex: 1,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <h3
              style={{
                margin: "0 0 6px 0",
                fontSize: 20,
                fontWeight: "bold",
                background: "linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🔮 Future Outlook
            </h3>

            {/* Prediction Summary */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 5,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: 6,
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 3 }}>
                  Current
                </div>
                <div
                  style={{ fontSize: 36, fontWeight: "bold", color: "#38BDF8" }}
                >
                  {currentAQI.toFixed(0)}
                </div>
              </div>

              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  padding: 6,
                  borderRadius: 8,
                  border: `2px solid ${trendColor}55`,
                }}
              >
                <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 3 }}>
                  Next 24h
                </div>
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: "bold",
                    color: trendColor,
                  }}
                >
                  {predictedAQI.toFixed(0)} {trendIcon}
                </div>
              </div>
            </div>

            {/* Forecast */}
            <div
              style={{
                background: `${forecast.color}20`,
                border: `1px solid ${forecast.color}`,
                borderRadius: 8,
                padding: 6,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: forecast.color,
                  marginBottom: 3,
                }}
              >
                {forecast.level}
              </div>
              <div style={{ fontSize: 14, opacity: 0.9 }}>
                {forecast.advice}
              </div>
            </div>

            {/* Smoking Level Section */}
            <div
              style={{
                background: "rgba(255, 100, 80, 0.15)",
                border: "1px solid rgba(255, 100, 80, 0.4)",
                borderRadius: 8,
                padding: 6,
                marginBottom: 6,
                display: "flex",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "160px",
                  height: "160px",
                  background:
                    "linear-gradient(135deg, rgba(255,100,80,0.2) 0%, rgba(200,50,30,0.1) 100%)",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid rgba(255,100,80,0.3)",
                  boxShadow: "0 4px 12px rgba(255,100,80,0.2)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      "radial-gradient(circle at center, rgba(255,100,80,0.1) 0%, transparent 70%)",
                  }}
                />
                <video
                  src="/cigrate.mp4"
                  autoPlay
                  loop
                  muted
                  style={{
                    width: "150px",
                    height: "150px",
                    objectFit: "contain",
                    filter: "drop-shadow(0 0 8px rgba(255,100,80,0.4))",
                    position: "relative",
                    zIndex: 1,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: "bold",
                    color: "#FF6450",
                    marginBottom: 4,
                    letterSpacing: "0.5px",
                  }}
                >
                  🚬 Smoking Equivalent
                </div>
                <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 4 }}>
                  Current: ~{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#FF6450",
                      fontSize: 15,
                    }}
                  >
                    {Math.max(1, Math.round(currentAQI / 25))}
                  </span>{" "}
                  cigarettes
                </div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  Predicted: ~{" "}
                  <span
                    style={{
                      fontWeight: "bold",
                      color: "#FF6450",
                      fontSize: 14,
                    }}
                  >
                    {Math.max(1, Math.round(predictedAQI / 25))}
                  </span>{" "}
                  cigarettes
                </div>
              </div>
            </div>

            {/* Quick Actions and Penguin Side by Side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2.8fr 1fr",
                gap: 6,
                alignItems: "center",
              }}
            >
              {/* Quick Actions */}
              <div
                style={{
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 8,
                  padding: 6,
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: "bold",
                    marginBottom: 4,
                    color: "#38BDF8",
                  }}
                >
                  💡 Key Actions
                </div>
                <div style={{ display: "grid", gap: 3 }}>
                  {forecast.actions.slice(0, 3).map((action, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 13,
                        padding: "3px 5px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 5,
                        borderLeft: `2px solid ${forecast.color}`,
                      }}
                    >
                      • {action}
                    </div>
                  ))}
                </div>
              </div>

              {/* Penguin Image */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  padding: 4,
                }}
              >
                <img
                  src={forecast.peng}
                  alt="Penguin status"
                  style={{
                    width: "140px",
                    height: "140px",
                    objectFit: "contain",
                    borderRadius: 8,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Card */}
        <div
          style={{
            background: "rgba(20,20,28,0.94)",
            backdropFilter: "blur(12px)",
            padding: 8,
            borderRadius: 10,
            border: "2px solid rgba(56, 189, 248, 0.4)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
            minHeight: "320px",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <video
            src="/cloud.mp4"
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.18,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,12,18,0.55) 0%, rgba(10,12,18,0.85) 100%)",
              zIndex: 1,
            }}
          />
          <div style={{ position: "relative", zIndex: 2 }}>
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: 20,
                fontWeight: "bold",
                background: "linear-gradient(90deg, #38BDF8 0%, #0EA5E9 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              📅 {currentMonth} Calendar
            </h3>

            {/* Weekday headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                marginBottom: 6,
              }}
            >
              {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "rgba(255,255,255,0.6)",
                    padding: 2,
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
                flex: 1,
                marginBottom: 8,
              }}
            >
              {calendarData.map((dayData, i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    background: dayData
                      ? getAQIColor(dayData.aqi)
                      : "rgba(255,255,255,0.05)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: "bold",
                    color:
                      dayData && dayData.aqi ? "#000" : "rgba(255,255,255,0.3)",
                    border:
                      dayData && dayData.day === new Date().getDate()
                        ? "2px solid #38BDF8"
                        : "1px solid rgba(255,255,255,0.1)",
                    opacity: dayData && !dayData.aqi ? 0.4 : 1,
                    transition: "transform 0.2s",
                    cursor: dayData ? "pointer" : "default",
                  }}
                  onMouseEnter={(e) => {
                    if (dayData) e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    if (dayData) e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {dayData ? dayData.day : ""}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: 6,
                borderTop: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 4,
                }}
              >
                AQI Levels:
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 4,
                }}
              >
                {[
                  { label: "Good", color: "#4ADE80" },
                  { label: "Moderate", color: "#FCD34D" },
                  { label: "Unhealthy", color: "#F87171" },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{ display: "flex", alignItems: "center", gap: 3 }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        background: item.color,
                        borderRadius: 2,
                      }}
                    />
                    <div
                      style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}
                    >
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        style={{
          marginTop: 12,
          padding: 8,
          background: "rgba(251, 146, 60, 0.1)",
          border: "1px solid rgba(251, 146, 60, 0.3)",
          borderRadius: 6,
          fontSize: 9,
          opacity: 0.8,
          textAlign: "center",
        }}
      >
        ⚠️ Predictions based on trends. Check real-time data regularly.
      </div>

      {/* Features Section (moved below disclaimer) */}
      <div
        style={{
          marginTop: 12,
          background:
            "linear-gradient(160deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95))",
          border: "1px solid rgba(147,51,234,0.35)",
          boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "white",
                letterSpacing: "0.3px",
              }}
            >
              🚀 Application Features
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.72)",
                fontSize: 12,
                marginTop: 3,
              }}
            >
              Everything packed into your AQI & climate experience.
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 10,
          }}
        >
          {featureList.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  display: "grid",
                  placeItems: "center",
                  background: "rgba(147,51,234,0.15)",
                  border: "1px solid rgba(147,51,234,0.4)",
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    color: "rgba(255,255,255,0.78)",
                    fontSize: 12,
                    lineHeight: 1.35,
                  }}
                >
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: 10,
          padding: "10px 12px",
          background: "rgba(10, 12, 18, 0.9)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 8,
          fontSize: 10,
          color: "rgba(255,255,255,0.72)",
          textAlign: "center",
        }}
      >
        <div>
          © 2025 AQI Insight — Live AQI, forecasts, and guidance. Stay updated
          with real-time data.
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            fontWeight: 600,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          ✨ Designed &amp; developed by Varshini J.
        </div>
      </div>

      {/* Contact Card */}
      <ContactCard />
    </div>
  );
}
