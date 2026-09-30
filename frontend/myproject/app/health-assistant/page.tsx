"use client";

import { useState } from "react";

export default function HealthAssistantPage() {

  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [duration, setDuration] = useState("");
  const [severity, setSeverity] = useState("");
  const [medications, setMedications] = useState("");

  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const API = "http://localhost:8000";


  async function analyzeSymptoms(
    e: React.FormEvent
  ) {

    e.preventDefault();

    if (!symptoms.trim()) {
      alert("Please enter your symptoms.");
      return;
    }

    setLoading(true);
    setAnalysis("");

    try {

      const response = await fetch(
        `${API}/api/health-assistant`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            age: age
              ? Number(age)
              : null,

            sex: sex || null,

            symptoms,

            duration:
              duration || null,

            severity:
              severity || null,

            medications:
              medications || null,

          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Health analysis failed."
        );

      }

      setAnalysis(data.response);

    } catch (error) {

      console.error(error);

      setAnalysis(
        "The AI health assistant could not analyze your symptoms. Please check that the FastAPI backend is running."
      );

    } finally {

      setLoading(false);

    }
  }


  return (

    <main
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "20px",
      }}
    >

      <h1>
        AI Health Symptom Assistant
      </h1>

      <p>
        Describe your symptoms and Gemini AI
        will provide general guidance and
        suggest what action may be appropriate.
      </p>


      <div
        style={{
          padding: "15px",
          marginBottom: "25px",
          border:
            "1px solid #f2b632",
          borderRadius: "8px",
        }}
      >

        <strong>
          Important
        </strong>

        <p>
          This tool does not provide a confirmed
          medical diagnosis and does not replace
          consultation with a qualified healthcare
          professional.
        </p>

      </div>


      <form
        onSubmit={analyzeSymptoms}
        style={{
          padding: "25px",
          borderRadius: "12px",
        }}
      >

        <label>
          Age
        </label>

        <input
          type="number"
          value={age}
          onChange={(e) =>
            setAge(e.target.value)
          }
          placeholder="Example: 35"
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />


        <label>
          Sex
        </label>

        <select
          value={sex}
          onChange={(e) =>
            setSex(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        >

          <option value="">
            Select
          </option>

          <option value="Male">
            Male
          </option>

          <option value="Female">
            Female
          </option>

          <option value="Other">
            Other
          </option>

          <option value="Prefer not to say">
            Prefer not to say
          </option>

        </select>


        <label>
          Symptoms *
        </label>

        <textarea
          value={symptoms}
          onChange={(e) =>
            setSymptoms(e.target.value)
          }
          placeholder="Example: Fever, headache, sore throat and cough..."
          style={{
            width: "100%",
            minHeight: "130px",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />


        <label>
          How long have you had these symptoms?
        </label>

        <input
          value={duration}
          onChange={(e) =>
            setDuration(e.target.value)
          }
          placeholder="Example: 2 days"
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        />


        <label>
          Severity
        </label>

        <select
          value={severity}
          onChange={(e) =>
            setSeverity(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "15px",
          }}
        >

          <option value="">
            Select severity
          </option>

          <option value="Mild">
            Mild
          </option>

          <option value="Moderate">
            Moderate
          </option>

          <option value="Severe">
            Severe
          </option>

        </select>


        <label>
          Current medications
        </label>

        <textarea
          value={medications}
          onChange={(e) =>
            setMedications(e.target.value)
          }
          placeholder="Optional"
          style={{
            width: "100%",
            minHeight: "70px",
            padding: "12px",
            marginTop: "5px",
            marginBottom: "20px",
          }}
        />


        <button
          className="ai-button"
          type="submit"
          disabled={loading}
        >

          {loading
            ? "Analyzing Symptoms..."
            : "✨ Analyze Symptoms"}

        </button>

      </form>


      {analysis && (

        <section
          className="ai-analysis"
          style={{
            marginTop: "30px",
            padding: "25px",
            borderRadius: "12px",
          }}
        >

          <h2>
            AI Health Assessment
          </h2>

          <div
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: "1.7",
            }}
          >

            {analysis}

          </div>

        </section>

      )}

    </main>
  );
}