"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Workspace = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

type Project = {
  id: string;
  workspace_id: string;
  slug: string;
  name: string;
  description: string;
  color: string;
  status: string;
};

type Column = {
  id: string;
  project_id: string;
  title: string;
  status_key: string;
  sort_order: number;
};

type Task = {
  id: string;
  project_id: string;
  column_id: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_minutes: number | null;
  spent_minutes: number;
  updated_at: string;
};

type TaskComment = {
  id: string;
  task_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
};

type TaskAttachment = {
  id: string;
  task_id: string;
  bucket_name: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
};

type BoardPayload = {
  workspace: Workspace | null;
  projects: Project[];
  columns: Column[];
  tasks: Task[];
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  todo: "Yapilacak",
  in_progress: "Devam Ediyor",
  review: "Inceleme",
  blocked: "Engelli",
  done: "Tamamlandi",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Dusuk",
  medium: "Orta",
  high: "Yuksek",
  urgent: "Acil",
};

const DEFAULT_NEW_TASK = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  estimatedMinutes: "60",
};

function formatShortDate(value: string | null) {
  if (!value) {
    return "Tarih yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function formatLongDate(value: string | null) {
  if (!value) {
    return "Belirtilmedi";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default function HomePage() {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string>("");
  const [booting, setBooting] = useState(true);
  const [busy, setBusy] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState({
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  });
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [commentDraft, setCommentDraft] = useState("");
  const [createMessage, setCreateMessage] = useState("");
  const [boardError, setBoardError] = useState("");
  const [newTask, setNewTask] = useState(DEFAULT_NEW_TASK);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  async function fetchBoardData(): Promise<BoardPayload> {
    const [workspaceResponse, projectsResponse, columnsResponse, tasksResponse] =
      await Promise.all([
        supabase
          .from("workspaces")
          .select("id, slug, name, description")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("projects")
          .select("id, workspace_id, slug, name, description, color, status")
          .order("created_at", { ascending: true }),
        supabase
          .from("project_columns")
          .select("id, project_id, title, status_key, sort_order")
          .order("sort_order", { ascending: true }),
        supabase
          .from("tasks")
          .select(
            "id, project_id, column_id, title, description, status, priority, due_date, estimated_minutes, spent_minutes, updated_at",
          )
          .order("sort_order", { ascending: true }),
      ]);

    const error =
      workspaceResponse.error ??
      projectsResponse.error ??
      columnsResponse.error ??
      tasksResponse.error;

    if (error) {
      throw error;
    }

    return {
      workspace: workspaceResponse.data,
      projects: (projectsResponse.data ?? []) as Project[],
      columns: (columnsResponse.data ?? []) as Column[],
      tasks: (tasksResponse.data ?? []) as Task[],
    };
  }

  function resetBoardState() {
    setWorkspace(null);
    setProjects([]);
    setColumns([]);
    setTasks([]);
    setSelectedProjectId(null);
    setSelectedTaskId(null);
    setComments([]);
    setAttachments([]);
    setCommentDraft("");
  }

  function hydrateTaskDetail(task: Task | null) {
    if (!task) {
      setSelectedTaskId(null);
      setComments([]);
      setAttachments([]);
      setCommentDraft("");
      return;
    }

    setSelectedTaskId(task.id);
    setDetailDraft({
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.due_date ?? "",
    });
    void loadComments(task.id);
    void loadAttachments(task.id);
  }

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
        setBooting(false);
        return;
      }

      const user = data.session?.user ?? null;
      setSessionUserId(user?.id ?? null);
      setSessionEmail(user?.email ?? "");
      if (!user) {
        resetBoardState();
      }
      setBooting(false);
    }

    void bootstrap();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      const user = session?.user ?? null;
      setSessionUserId(user?.id ?? null);
      setSessionEmail(user?.email ?? "");
      setAuthError("");
      setAuthMessage("");
      setBoardError("");
      if (!user) {
        resetBoardState();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionUserId) {
      return;
    }

    void loadBoard();
  }, [sessionUserId]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId],
  );

  const selectedColumns = useMemo(
    () =>
      columns
        .filter((column) => column.project_id === selectedProjectId)
        .sort((a, b) => a.sort_order - b.sort_order),
    [columns, selectedProjectId],
  );

  const projectTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.project_id === selectedProjectId)
        .sort((a, b) => Number(a.status === "done") - Number(b.status === "done")),
    [tasks, selectedProjectId],
  );

  const selectedTask = useMemo(
    () => projectTasks.find((task) => task.id === selectedTaskId) ?? null,
    [projectTasks, selectedTaskId],
  );

  const taskStats = useMemo(() => {
    const doneCount = projectTasks.filter((task) => task.status === "done").length;
    const blockedCount = projectTasks.filter((task) => task.status === "blocked").length;
    const dueSoonCount = projectTasks.filter((task) => {
      if (!task.due_date) {
        return false;
      }

      const today = new Date();
      const due = new Date(task.due_date);
      const diff = due.getTime() - today.getTime();
      return diff > 0 && diff <= 1000 * 60 * 60 * 24 * 3;
    }).length;

    return {
      total: projectTasks.length,
      done: doneCount,
      blocked: blockedCount,
      dueSoon: dueSoonCount,
    };
  }, [projectTasks]);

  async function loadBoard() {
    setBusy(true);
    setBoardError("");
    try {
      let payload = await fetchBoardData();

      if (!payload.workspace) {
        const bootstrapResponse = await supabase.rpc("ensure_default_workspace");

        if (bootstrapResponse.error) {
          throw bootstrapResponse.error;
        }

        payload = await fetchBoardData();
      }

      const nextWorkspace = payload.workspace;
      const nextProjects = payload.projects;
      const nextColumns = payload.columns;
      const nextTasks = payload.tasks;

      setWorkspace(nextWorkspace);
      setProjects(nextProjects);
      setColumns(nextColumns);
      setTasks(nextTasks);
      setSelectedProjectId((current) => {
        if (current && nextProjects.some((project) => project.id === current)) {
          return current;
        }
        return nextProjects[0]?.id ?? null;
      });
      setSelectedTaskId((current) => {
        if (current && nextTasks.some((task) => task.id === current)) {
          return current;
        }
        return null;
      });
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Pano verileri alinamadi.");
    } finally {
      setBusy(false);
    }
  }

  async function loadComments(taskId: string) {
    const { data, error } = await supabase
      .from("task_comments")
      .select("id, task_id, author_user_id, body, created_at")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      setBoardError(error.message);
      return;
    }

    setComments((data ?? []) as TaskComment[]);
  }

  async function loadAttachments(taskId: string) {
    const { data, error } = await supabase
      .from("task_attachments")
      .select(
        "id, task_id, bucket_name, storage_path, file_name, mime_type, file_size, created_at",
      )
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });

    if (error) {
      setBoardError(error.message);
      return;
    }

    setAttachments((data ?? []) as TaskAttachment[]);
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setAuthError("");
    setAuthMessage("");

    if (authMode === "register") {
      const { error } = await supabase.auth.signUp({
        email: authEmail,
        password: authPassword,
        options: {
          data: {
            full_name: authName,
          },
        },
      });

      setBusy(false);

      if (error) {
        setAuthError(error.message);
        return;
      }

      setAuthMessage(
        "Hesap olusturuldu. E-posta dogrulamasi aciksa kutunuzu kontrol edin, kapaliysa dogrudan giris yapabilirsiniz.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });

    setBusy(false);

    if (error) {
      setAuthError(error.message);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedProjectId) {
      setCreateMessage("Once bir proje secmeniz gerekiyor.");
      return;
    }

    const matchingColumn =
      selectedColumns.find((column) => column.status_key === newTask.status) ??
      selectedColumns[0];

    const { error } = await supabase.from("tasks").insert({
      project_id: selectedProjectId,
      column_id: matchingColumn?.id ?? null,
      title: newTask.title.trim(),
      description: newTask.description.trim(),
      status: newTask.status,
      priority: newTask.priority,
      due_date: newTask.dueDate || null,
      estimated_minutes: Number(newTask.estimatedMinutes || 0) || null,
      spent_minutes: 0,
      reporter_user_id: sessionUserId,
    });

    if (error) {
      setCreateMessage(error.message);
      return;
    }

    setCreateMessage("Yeni gorev panoya eklendi.");
    setNewTask(DEFAULT_NEW_TASK);
    await loadBoard();
  }

  async function handleSaveTask() {
    if (!selectedTask) {
      return;
    }

    const matchingColumn =
      selectedColumns.find((column) => column.status_key === detailDraft.status) ??
      null;

    const { error } = await supabase
      .from("tasks")
      .update({
        description: detailDraft.description,
        status: detailDraft.status,
        priority: detailDraft.priority,
        due_date: detailDraft.dueDate || null,
        column_id: matchingColumn?.id ?? null,
      })
      .eq("id", selectedTask.id);

    if (error) {
      setBoardError(error.message);
      return;
    }

    await loadBoard();
    await loadComments(selectedTask.id);
    await loadAttachments(selectedTask.id);
  }

  async function handleAddComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTask || !commentDraft.trim() || !sessionUserId) {
      return;
    }

    const { error } = await supabase.from("task_comments").insert({
      task_id: selectedTask.id,
      body: commentDraft.trim(),
      author_user_id: sessionUserId,
    });

    if (error) {
      setBoardError(error.message);
      return;
    }

    setCommentDraft("");
    await loadComments(selectedTask.id);
  }

  async function handleTaskDrop(taskId: string, nextStatus: string) {
    const task = projectTasks.find((item) => item.id === taskId);

    setDragOverStatus(null);
    setDraggingTaskId(null);

    if (!task) {
      return;
    }

    const targetColumn = selectedColumns.find((column) => column.status_key === nextStatus);

    if (!targetColumn) {
      return;
    }

    if (task.status === nextStatus && task.column_id === targetColumn.id) {
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        column_id: targetColumn.id,
      })
      .eq("id", taskId);

    if (error) {
      setBoardError(error.message);
      return;
    }

    await loadBoard();
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!selectedTask || !sessionUserId || files.length === 0) {
      return;
    }

    setUploadingFiles(true);
    setBoardError("");

    try {
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const storagePath = `${selectedTask.id}/${Date.now()}-${safeName}`;

        const uploadResponse = await supabase.storage
          .from("task-files")
          .upload(storagePath, file, { upsert: false });

        if (uploadResponse.error) {
          throw new Error(uploadResponse.error.message);
        }

        const attachmentResponse = await supabase.from("task_attachments").insert({
          task_id: selectedTask.id,
          uploaded_by: sessionUserId,
          bucket_name: "task-files",
          storage_path: storagePath,
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
        });

        if (attachmentResponse.error) {
          throw new Error(attachmentResponse.error.message);
        }
      }

      await loadAttachments(selectedTask.id);
    } catch (error) {
      setBoardError(error instanceof Error ? error.message : "Dosya yuklenemedi.");
    } finally {
      setUploadingFiles(false);
      event.target.value = "";
    }
  }

  async function handleOpenAttachment(attachment: TaskAttachment) {
    const { data, error } = await supabase.storage
      .from(attachment.bucket_name)
      .createSignedUrl(attachment.storage_path, 60);

    if (error) {
      setBoardError(error.message);
      return;
    }

    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }
  }

  if (booting) {
    return (
      <main className="app-shell">
        <section className="hero-card" style={{ minHeight: "calc(100vh - 56px)" }}>
          <div className="hero-badge">
            <span className="spinner" />
            Supabase oturumu yukleniyor
          </div>
        </section>
      </main>
    );
  }

  if (!sessionUserId) {
    return (
      <main className="app-shell">
        <section className="auth-screen">
          <article className="hero-card">
            <div>
              <div className="hero-badge">
                <Sparkles size={14} />
                Supabase destekli is akisi
              </div>
              <h1 className="hero-title">Projeleri karistirmadan yonet.</h1>
              <p className="hero-copy">
                `Fizik Lab`, `YDS Kocum` ve yeni urunleri tek bir workspace icinde
                toplayip, gorevleri panoda suruklemesek bile tertemiz bir ritimle
                takip edelim.
              </p>
              <div className="hero-grid">
                <article>
                  <p>Kanban</p>
                  <p>Backlog&apos;dan tamamlandi kolonuna kadar akici takip</p>
                </article>
                <article>
                  <p>Supabase</p>
                  <p>Auth, veri ve yorumlar tek yerde</p>
                </article>
                <article>
                  <p>Tek Workspace</p>
                  <p>Butun `benim-site` projeleri ayni duzende</p>
                </article>
                <article>
                  <p>Hemen Basla</p>
                  <p>Giris yap, gorev ekle, durumu guncelle</p>
                </article>
              </div>
            </div>
            <div className="info-box">
              SQL tarafinda `task-tracker-schema.sql` ve `task-tracker-seed.sql`
              calistiysa, giris yaptiktan sonra panonuz dogrudan yuklenecek.
            </div>
          </article>

          <article className="auth-card">
            <div className="auth-tabs">
              <button
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
                type="button"
              >
                Giris Yap
              </button>
              <button
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
                type="button"
              >
                Hesap Ac
              </button>
            </div>

            <h2 className="section-title" style={{ marginTop: 22 }}>
              {authMode === "login" ? "Pano kapisini acalim" : "Yeni ekip girisi olustur"}
            </h2>
            <p className="section-copy">
              Supabase Auth ile oturum aciliyor. Ilk kayit sonrasi e-posta
              dogrulamasi aciksa kutunuzu kontrol etmeniz gerekebilir.
            </p>

            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" ? (
                <label>
                  Ad
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Ekip sahibi"
                    required
                  />
                </label>
              ) : null}

              <label>
                E-posta
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  type="email"
                  placeholder="ornek@mail.com"
                  required
                />
              </label>

              <label>
                Sifre
                <input
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  type="password"
                  placeholder="En az 6 karakter"
                  minLength={6}
                  required
                />
              </label>

              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Isleniyor..." : authMode === "login" ? "Giris Yap" : "Kayit Ol"}
              </button>
            </form>

            {authMessage ? <div className="info-box">{authMessage}</div> : null}
            {authError ? <div className="error-box">{authError}</div> : null}
          </article>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="dashboard">
        <aside className="sidebar-stack">
          <section className="panel">
            <div className="sidebar-header">
              <div>
                <p className="eyebrow">Workspace</p>
                <h1 className="section-title">{workspace?.name ?? "Benim Site"}</h1>
                <p className="section-copy">
                  {workspace?.description ??
                    "Supabase panosu baglandi. Simdi projeleri tek yerde topluyoruz."}
                </p>
              </div>
              <button className="secondary-button" onClick={handleLogout} type="button">
                <LogOut size={16} />
              </button>
            </div>

            <div className="info-box" style={{ marginTop: 18 }}>
              Oturum: <strong>{sessionEmail}</strong>
            </div>

            <div className="project-list">
              {projects.map((project) => (
                <button
                  className={`project-card ${project.id === selectedProjectId ? "active" : ""}`}
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    hydrateTaskDetail(null);
                  }}
                  type="button"
                >
                  <div className="meta">
                    <span className="project-dot" style={{ background: project.color }} />
                    <span>{project.status}</span>
                  </div>
                  <h3 style={{ margin: "12px 0 8px" }}>{project.name}</h3>
                  <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6 }}>
                    {project.description}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="sidebar-header">
              <div>
                <p className="eyebrow">Yeni Gorev</p>
                <h2 className="section-title">Pano icine hizli ekle</h2>
              </div>
              <Plus size={18} />
            </div>

            <form className="create-form" onSubmit={handleCreateTask}>
              <input
                value={newTask.title}
                onChange={(event) =>
                  setNewTask((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Gorev basligi"
                required
              />
              <textarea
                value={newTask.description}
                onChange={(event) =>
                  setNewTask((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Kisa aciklama"
                rows={4}
              />
              <div className="create-form-row">
                <select
                  value={newTask.status}
                  onChange={(event) =>
                    setNewTask((current) => ({ ...current, status: event.target.value }))
                  }
                >
                  {selectedColumns.map((column) => (
                    <option key={column.id} value={column.status_key}>
                      {STATUS_LABELS[column.status_key] ?? column.title}
                    </option>
                  ))}
                </select>
                <select
                  value={newTask.priority}
                  onChange={(event) =>
                    setNewTask((current) => ({ ...current, priority: event.target.value }))
                  }
                >
                  {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="create-form-row">
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(event) =>
                    setNewTask((current) => ({ ...current, dueDate: event.target.value }))
                  }
                />
                <input
                  type="number"
                  value={newTask.estimatedMinutes}
                  onChange={(event) =>
                    setNewTask((current) => ({
                      ...current,
                      estimatedMinutes: event.target.value,
                    }))
                  }
                  min={15}
                  step={15}
                />
              </div>
              <button className="primary-button" type="submit">
                Gorevi Ekle
              </button>
            </form>

            {createMessage ? <div className="info-box">{createMessage}</div> : null}
          </section>
        </aside>

        <section className="board-panel">
          <header>
            <div className="board-header">
              <div>
                <p className="eyebrow">Aktif Proje</p>
                <h2 className="board-title">
                  {selectedProject?.name ?? "Proje secimi bekleniyor"}
                </h2>
                <p className="board-copy">
                  {selectedProject?.description ??
                    "Supabase panosunda gosterilecek bir proje secin."}
                </p>
              </div>
              <button className="secondary-button" onClick={() => void loadBoard()} type="button">
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="stats-grid">
              <article>
                <p>Toplam Gorev</p>
                <p>{taskStats.total}</p>
              </article>
              <article>
                <p>Tamamlanan</p>
                <p>{taskStats.done}</p>
              </article>
              <article>
                <p>Yaklasan Tarih</p>
                <p>{taskStats.dueSoon}</p>
              </article>
            </div>

            {boardError ? <div className="error-box">{boardError}</div> : null}

            {!workspace && !busy ? (
              <div className="empty-state" style={{ marginTop: 18 }}>
                Workspace henuz hazir degil. Sayfayi yenileyin; uygulama giris yaptiginiz
                hesap icin gerekli temel yapilari otomatik kurmaya calisir.
              </div>
            ) : null}
          </header>

          <div className="board-scroll">
            {selectedColumns.map((column) => {
              const columnTasks = projectTasks.filter(
                (task) => task.status === column.status_key,
              );

              return (
                <section className="column" key={column.id}>
                  <div
                    className={`column-dropzone ${
                      dragOverStatus === column.status_key ? "active" : ""
                    }`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggingTaskId) {
                        setDragOverStatus(column.status_key);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverStatus === column.status_key) {
                        setDragOverStatus(null);
                      }
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const taskId = event.dataTransfer.getData("text/task-id");
                      if (taskId) {
                        void handleTaskDrop(taskId, column.status_key);
                      }
                    }}
                  >
                    <div className="column-top">
                    <div>
                      <h3 className="column-title">
                        {STATUS_LABELS[column.status_key] ?? column.title}
                      </h3>
                    </div>
                    <span className="count-pill">{columnTasks.length}</span>
                    </div>

                    <div className="task-stack">
                      {columnTasks.map((task) => (
                        <button
                          className={`task-card ${task.id === selectedTaskId ? "active" : ""} ${
                            draggingTaskId === task.id ? "dragging" : ""
                          }`}
                          key={task.id}
                          onClick={() => hydrateTaskDetail(task)}
                          type="button"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.setData("text/task-id", task.id);
                            event.dataTransfer.effectAllowed = "move";
                            setDraggingTaskId(task.id);
                          }}
                          onDragEnd={() => {
                            setDraggingTaskId(null);
                            setDragOverStatus(null);
                          }}
                        >
                          <span className="priority-pill">
                            {PRIORITY_LABELS[task.priority] ?? task.priority}
                          </span>
                          <h4>{task.title}</h4>
                          <p>{task.description || "Detay eklenmemis."}</p>
                          <div className="task-footer">
                            <span>{formatShortDate(task.due_date)}</span>
                            <span>{task.estimated_minutes ?? 0} dk</span>
                          </div>
                        </button>
                      ))}

                      {columnTasks.length === 0 ? (
                        <div className="empty-state">
                          Bu kolonda henuz gorev yok. Isterseniz soldan hizli bir gorev
                          ekleyelim.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <aside className="detail-stack">
          <section className="task-detail">
            <div className="task-detail-header">
              <div>
                <p className="eyebrow">Gorev Detayi</p>
                <h3>{selectedTask?.title ?? "Bir kart secin"}</h3>
              </div>
              <FolderKanban size={18} />
            </div>

            {!selectedTask ? (
              <div className="empty-state">
                Ortadaki panodan bir kart sectiginizde aciklama, durum, oncelik ve
                yorum akisi burada gorunecek.
              </div>
            ) : (
              <>
                <div className="task-meta">
                  <article>
                    <p>Durum</p>
                    <p>{STATUS_LABELS[selectedTask.status] ?? selectedTask.status}</p>
                  </article>
                  <article>
                    <p>Oncelik</p>
                    <p>{PRIORITY_LABELS[selectedTask.priority] ?? selectedTask.priority}</p>
                  </article>
                  <article>
                    <p>Teslim</p>
                    <p>{formatLongDate(selectedTask.due_date)}</p>
                  </article>
                  <article>
                    <p>Tahmini Sure</p>
                    <p>{selectedTask.estimated_minutes ?? 0} dk</p>
                  </article>
                </div>

                <div className="detail-form">
                  <textarea
                    rows={5}
                    value={detailDraft.description}
                    onChange={(event) =>
                      setDetailDraft((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                  <div className="detail-form-row">
                    <select
                      value={detailDraft.status}
                      onChange={(event) =>
                        setDetailDraft((current) => ({
                          ...current,
                          status: event.target.value,
                        }))
                      }
                    >
                      {selectedColumns.map((column) => (
                        <option key={column.id} value={column.status_key}>
                          {STATUS_LABELS[column.status_key] ?? column.title}
                        </option>
                      ))}
                    </select>
                    <select
                      value={detailDraft.priority}
                      onChange={(event) =>
                        setDetailDraft((current) => ({
                          ...current,
                          priority: event.target.value,
                        }))
                      }
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="date"
                    value={detailDraft.dueDate}
                    onChange={(event) =>
                      setDetailDraft((current) => ({
                        ...current,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                  <button className="primary-button" onClick={handleSaveTask} type="button">
                    Gorevi Kaydet
                  </button>
                </div>

                <div>
                  <div className="sidebar-header" style={{ marginBottom: 12 }}>
                    <div>
                      <p className="eyebrow">Yorumlar</p>
                      <h3 style={{ margin: 0 }}>Gorev Konusmasi</h3>
                    </div>
                    <MessageSquare size={18} />
                  </div>

                  <form className="create-form" onSubmit={handleAddComment}>
                    <textarea
                      rows={3}
                      value={commentDraft}
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Yorum ekle"
                    />
                    <button className="secondary-button" type="submit">
                      Yorumu Gonder
                    </button>
                  </form>

                  <div className="comments" style={{ marginTop: 14 }}>
                    {comments.map((comment) => (
                      <article className="comment-card" key={comment.id}>
                        <p>
                          <strong>
                            {comment.author_user_id === sessionUserId ? "Sen" : "Ekip uyesi"}
                          </strong>{" "}
                          • {new Date(comment.created_at).toLocaleString("tr-TR")}
                        </p>
                        <p style={{ marginTop: 10 }}>{comment.body}</p>
                      </article>
                    ))}

                    {comments.length === 0 ? (
                      <div className="empty-state">
                        Bu kartta henuz yorum yok. Ilk notu siz dusun.
                      </div>
                    ) : null}
                  </div>
                </div>

                <div>
                  <div className="sidebar-header" style={{ marginBottom: 12 }}>
                    <div>
                      <p className="eyebrow">Dosyalar</p>
                      <h3 style={{ margin: 0 }}>Gorev Ekleri</h3>
                    </div>
                    <FolderKanban size={18} />
                  </div>

                  <label className="upload-box">
                    <input
                      type="file"
                      multiple
                      onChange={(event) => void handleFileUpload(event)}
                      disabled={uploadingFiles}
                    />
                    <span>
                      {uploadingFiles
                        ? "Dosyalar yukleniyor..."
                        : "Dosya sec veya buradan goreve ekle"}
                    </span>
                  </label>

                  <div className="comments" style={{ marginTop: 14 }}>
                    {attachments.map((attachment) => (
                      <button
                        className="attachment-card"
                        key={attachment.id}
                        onClick={() => void handleOpenAttachment(attachment)}
                        type="button"
                      >
                        <strong>{attachment.file_name}</strong>
                        <span>
                          {attachment.file_size
                            ? `${Math.round(attachment.file_size / 1024)} KB`
                            : "Boyut yok"}{" "}
                          • {new Date(attachment.created_at).toLocaleString("tr-TR")}
                        </span>
                      </button>
                    ))}

                    {attachments.length === 0 ? (
                      <div className="empty-state">
                        Bu gorev icin henuz dosya eklenmemis.
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </section>

          <section className="panel">
            <div className="sidebar-header">
              <div>
                <p className="eyebrow">Calisma Ritmi</p>
                <h2 className="section-title">Bugunun Ozeti</h2>
              </div>
              <ShieldCheck size={18} />
            </div>

            <div className="hero-grid" style={{ marginTop: 18 }}>
              <article>
                <p>Panoda</p>
                <p>{taskStats.total} kart acik</p>
              </article>
              <article>
                <p>Bitirilen</p>
                <p>{taskStats.done} kart</p>
              </article>
              <article>
                <p>Engelli</p>
                <p>{taskStats.blocked} kart</p>
              </article>
              <article>
                <p>Aktif Proje</p>
                <p>{selectedProject?.name ?? "Secim yok"}</p>
              </article>
            </div>

            <div className="info-box" style={{ marginTop: 18 }}>
              Bu ilk surum gorevleri ve yorumlari yonetir. Sonraki adimda drag-drop,
              etiketler ve dosya eklerini de acabiliriz.
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
