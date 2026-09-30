"use client";

import { useEffect, useState } from "react";

interface Todo {
  id: number;
  title: string;
  description?: string;
  completed: boolean;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [aiAnalysis, setAiAnalysis] = useState("");
  const [message, setMessage] = useState("");

  const API = "http://localhost:8000";

  // =========================================================
  // LOAD TODOS
  // =========================================================

  async function loadTodos() {
    try {
      setLoading(true);

      const response = await fetch(`${API}/todos`);

      if (!response.ok) {
        throw new Error("Unable to load Todo List.");
      }

      const data = await response.json();

      setTodos(data);
    } catch (error) {
      console.error(error);

      setMessage(
        "Could not load Todo List. Make sure the FastAPI backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTodos();
  }, []);

  // =========================================================
  // ADD TODO
  // =========================================================

  async function addTodo(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setMessage("Please enter a task title.");
      return;
    }

    try {
      setMessage("");

      const response = await fetch(`${API}/todos`, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false,
        }),
      });

      if (!response.ok) {
        const data = await response.json();

        throw new Error(
          data.detail || "Unable to create task."
        );
      }

      setTitle("");
      setDescription("");

      // Clear previous AI analysis because Todo List changed
      setAiAnalysis("");

      await loadTodos();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to create task."
      );
    }
  }

  // =========================================================
  // TOGGLE COMPLETE
  // =========================================================

  async function toggleTodo(id: number) {
    try {
      const response = await fetch(
        `${API}/todos/${id}/toggle`,
        {
          method: "PATCH",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to update task."
        );
      }

      setAiAnalysis("");

      await loadTodos();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to update the task."
      );
    }
  }

  // =========================================================
  // DELETE TODO
  // =========================================================

  async function deleteTodo(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/todos/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Unable to delete task."
        );
      }

      setAiAnalysis("");

      await loadTodos();
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to delete the task."
      );
    }
  }

  // =========================================================
  // GEMINI AI PRIORITY ANALYSIS
  // =========================================================

  async function analyzeTodos() {
    const unfinishedTodos = todos.filter(
      (todo) => !todo.completed
    );

    if (unfinishedTodos.length === 0) {
      setAiAnalysis(
        "There are no unfinished tasks to analyze."
      );
      return;
    }

    setAiLoading(true);
    setAiAnalysis("");
    setMessage("");

    const todoText = unfinishedTodos
      .map((todo, index) => {
        return `
Task ${index + 1}
Title: ${todo.title}
Description: ${
          todo.description ||
          "No description provided"
        }
`;
      })
      .join("\n");

    const prompt = `
You are an intelligent Todo List assistant.

Analyze the following unfinished tasks:

${todoText}

Determine which tasks should be prioritized.

Use the following sections:

HIGH PRIORITY
MEDIUM PRIORITY
LOW PRIORITY

For every task:

- State the task title.
- Assign a priority.
- Briefly explain why.
- Do not invent deadlines or facts that were not provided.

At the end include:

RECOMMENDED FIRST TASK

Clearly state which task should be done first and briefly explain why.

Keep the response practical, simple, and concise.
`;

    try {
      const response = await fetch(
        `${API}/api/ai`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            message: prompt,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
          "Gemini AI analysis failed."
        );
      }

      setAiAnalysis(data.response);
    } catch (error) {
      console.error(error);

      setAiAnalysis(
        "Gemini AI could not analyze the Todo List. Make sure the FastAPI backend and Gemini API are working."
      );
    } finally {
      setAiLoading(false);
    }
  }

  // =========================================================
  // COUNTS
  // =========================================================

  const totalTasks = todos.length;

  const completedTasks =
    todos.filter(
      (todo) => todo.completed
    ).length;

  const remainingTasks =
    totalTasks - completedTasks;

  // =========================================================
  // UI
  // =========================================================

  return (
    <main
      style={{
        maxWidth: "1050px",
        margin: "0 auto",
        padding: "40px 20px 70px",
      }}
    >
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div
        style={{
          marginBottom: "30px",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
          }}
        >
          Todo List
        </h1>

        <p
          style={{
            marginTop: 0,
            maxWidth: "750px",
            lineHeight: "1.6",
          }}
        >
          Manage your tasks and use Gemini AI
          to help identify what should be
          prioritized first.
        </p>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div
          className="card"
          style={{
            padding: "18px",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#aeb5c0",
            }}
          >
            TOTAL TASKS
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginTop: "5px",
              color: "#ffd96a",
            }}
          >
            {totalTasks}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#aeb5c0",
            }}
          >
            REMAINING
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginTop: "5px",
              color: "#e3262e",
            }}
          >
            {remainingTasks}
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "18px",
            borderRadius: "10px",
          }}
        >
          <div
            style={{
              fontSize: "13px",
              color: "#aeb5c0",
            }}
          >
            COMPLETED
          </div>

          <div
            style={{
              fontSize: "30px",
              fontWeight: "bold",
              marginTop: "5px",
              color: "#43d17a",
            }}
          >
            {completedTasks}
          </div>
        </div>
      </div>

      {/* =====================================================
          ADD TASK
      ====================================================== */}

      <form
        onSubmit={addTodo}
        style={{
          padding: "25px",
          borderRadius: "12px",
          marginBottom: "30px",
        }}
      >
        <h2
          style={{
            marginTop: 0,
          }}
        >
          Add New Task
        </h2>

        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: 600,
          }}
        >
          Task Title
        </label>

        <input
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(
              event.target.value
            )
          }
          placeholder="Example: Finish Advanced Operating Systems assignment"
          style={{
            width: "100%",
            padding: "12px",
            marginBottom: "16px",
          }}
        />

        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontWeight: 600,
          }}
        >
          Description
        </label>

        <textarea
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="Add details, deadline, importance, or other information that may help Gemini assess the priority."
          style={{
            width: "100%",
            minHeight: "95px",
            padding: "12px",
            marginBottom: "18px",
            resize: "vertical",
          }}
        />

        <button type="submit">
          Add Task
        </button>
      </form>

      {/* =====================================================
          MESSAGE
      ====================================================== */}

      {message && (
        <div
          style={{
            padding: "14px",
            marginBottom: "20px",
            borderRadius: "8px",
            border:
              "1px solid rgba(242,182,50,0.4)",
            background:
              "rgba(242,182,50,0.08)",
          }}
        >
          {message}
        </div>
      )}

      {/* =====================================================
          TASK HEADER
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
            }}
          >
            My Tasks
          </h2>

          <p
            style={{
              margin:
                "5px 0 0 0",
              fontSize: "14px",
            }}
          >
            {remainingTasks} unfinished task
            {remainingTasks !== 1
              ? "s"
              : ""}
          </p>
        </div>

        <button
          className="ai-button"
          onClick={analyzeTodos}
          disabled={
            aiLoading ||
            remainingTasks === 0
          }
          type="button"
          style={{
            minWidth: "210px",
          }}
        >
          {aiLoading
            ? "Analyzing Tasks..."
            : "✨ AI Priority Analysis"}
        </button>
      </div>

      {/* =====================================================
          TODO LIST
      ====================================================== */}

      {loading ? (
        <div
          className="card"
          style={{
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          Loading tasks...
        </div>
      ) : todos.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "35px",
            borderRadius: "10px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              marginTop: 0,
            }}
          >
            No tasks yet
          </h3>

          <p>
            Add your first task above.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {todos.map((todo) => (
            <div
              key={todo.id}
              className="todo-item"
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "20px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems:
                    "flex-start",
                  gap: "12px",
                  flex: 1,
                }}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() =>
                    toggleTodo(todo.id)
                  }
                  style={{
                    marginTop: "4px",
                  }}
                />

                <div>
                  <div
                    style={{
                      fontSize: "17px",
                      fontWeight: 700,

                      textDecoration:
                        todo.completed
                          ? "line-through"
                          : "none",

                      opacity:
                        todo.completed
                          ? 0.55
                          : 1,
                    }}
                  >
                    {todo.title}
                  </div>

                  {todo.description && (
                    <p
                      style={{
                        margin:
                          "7px 0 0 0",
                        lineHeight: "1.5",
                        whiteSpace:
                          "pre-wrap",
                      }}
                    >
                      {
                        todo.description
                      }
                    </p>
                  )}

                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "12px",

                      color:
                        todo.completed
                          ? "#43d17a"
                          : "#aeb5c0",
                    }}
                  >
                    {todo.completed
                      ? "Completed"
                      : "Pending"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  deleteTodo(todo.id)
                }
                style={{
                  flexShrink: 0,
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================
          GEMINI AI ANALYSIS
      ====================================================== */}

      {aiAnalysis && (
        <section
          className="ai-analysis"
          style={{
            marginTop: "35px",
            padding: "25px",
            borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                }}
              >
                ✨ Gemini AI Priority
                Analysis
              </h2>

              <p
                style={{
                  margin:
                    "6px 0 0 0",
                  fontSize: "14px",
                }}
              >
                AI-generated recommendations
                based on your unfinished
                tasks.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setAiAnalysis("")
              }
            >
              Close
            </button>
          </div>

          <div
            style={{
              whiteSpace:
                "pre-wrap",
              lineHeight: "1.75",
            }}
          >
            {aiAnalysis}
          </div>

          <div
            style={{
              marginTop: "20px",
              paddingTop: "15px",

              borderTop:
                "1px solid rgba(77,231,255,0.2)",

              fontSize: "13px",
              color: "#aeb5c0",
            }}
          >
            Gemini provides recommendations.
            You remain in control of which
            task to perform first.
          </div>
        </section>
      )}
    </main>
  );
}