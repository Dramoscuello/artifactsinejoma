// Service for REST API communication with Axum backend

let API_BASE = import.meta.env.VITE_API_URL;
if (!API_BASE) {
  if (window.location.port === '5173') {
    API_BASE = `http://${window.location.hostname}:8000`;
  } else {
    // Relative URL when served via Nginx in Docker
    API_BASE = '';
  }
}

const STORAGE_KEYS = {
  GRADES: 'inejoma_v2_grades',
  SUBJECTS: 'inejoma_v2_subjects',
  ARTIFACTS: 'inejoma_v2_artifacts',
  SESSIONS: 'inejoma_v2_sessions',
};

function getStored(key) {
  const item = localStorage.getItem(key);
  if (!item) return [];
  try {
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function setStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export const apiService = {
  // Grados
  getGrades: async () => {
    let backendData = [];
    try {
      const res = await fetch(`${API_BASE}/api/grades`);
      if (res.ok) {
        const data = await res.json();
        backendData = Array.isArray(data) ? data : [];
      }
    } catch (e) {}

    const localData = getStored(STORAGE_KEYS.GRADES);
    const backendIds = new Set(backendData.map((g) => g.id));
    const onlyLocal = localData.filter((g) => !backendIds.has(g.id));
    return [...backendData, ...onlyLocal];
  },
  saveGrade: async (grade) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      const isEdit = !!grade.id;
      const url = isEdit ? `${API_BASE}/api/grades/${grade.id}` : `${API_BASE}/api/grades`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: grade.name,
          description: grade.description || null,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        const grades = getStored(STORAGE_KEYS.GRADES);
        setStored(STORAGE_KEYS.GRADES, grades.filter((g) => g.id !== grade.id));
        return saved;
      }
      const errText = await res.text();
      console.error(`Error HTTP al guardar grado (${res.status}):`, errText);
    } catch (e) {
      console.error('Error de red al guardar grado:', e);
    }

    const grades = getStored(STORAGE_KEYS.GRADES);
    if (grade.id) {
      const index = grades.findIndex((g) => g.id === grade.id);
      if (index !== -1) grades[index] = grade;
    } else {
      grade.id = 'g-' + Date.now();
      grades.push(grade);
    }
    setStored(STORAGE_KEYS.GRADES, grades);
    return grade;
  },
  deleteGrade: async (id) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      await fetch(`${API_BASE}/api/grades/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}

    let grades = getStored(STORAGE_KEYS.GRADES);
    grades = grades.filter((g) => g.id !== id);
    setStored(STORAGE_KEYS.GRADES, grades);
  },

  // Asignaturas
  getSubjects: async () => {
    let backendData = [];
    try {
      const res = await fetch(`${API_BASE}/api/subjects`);
      if (res.ok) {
        const data = await res.json();
        backendData = Array.isArray(data) ? data : [];
      }
    } catch (e) {}

    const localData = getStored(STORAGE_KEYS.SUBJECTS);
    const backendIds = new Set(backendData.map((s) => s.id));
    const onlyLocal = localData.filter((s) => !backendIds.has(s.id));
    return [...backendData, ...onlyLocal];
  },
  saveSubject: async (subject) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      const isEdit = !!subject.id;
      const url = isEdit ? `${API_BASE}/api/subjects/${subject.id}` : `${API_BASE}/api/subjects`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: subject.name,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        const subjects = getStored(STORAGE_KEYS.SUBJECTS);
        setStored(STORAGE_KEYS.SUBJECTS, subjects.filter((s) => s.id !== subject.id));
        return saved;
      }
      const errText = await res.text();
      console.error(`Error HTTP al guardar asignatura (${res.status}):`, errText);
    } catch (e) {
      console.error('Error de red al guardar asignatura:', e);
    }

    const subjects = getStored(STORAGE_KEYS.SUBJECTS);
    if (subject.id) {
      const index = subjects.findIndex((s) => s.id === subject.id);
      if (index !== -1) subjects[index] = subject;
    } else {
      subject.id = 's-' + Date.now();
      subjects.push(subject);
    }
    setStored(STORAGE_KEYS.SUBJECTS, subjects);
    return subject;
  },
  deleteSubject: async (id) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      await fetch(`${API_BASE}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}

    let subjects = getStored(STORAGE_KEYS.SUBJECTS);
    subjects = subjects.filter((s) => s.id !== id);
    setStored(STORAGE_KEYS.SUBJECTS, subjects);
  },

  // Artefactos
  getArtifacts: async () => {
    let backendData = [];
    try {
      const res = await fetch(`${API_BASE}/api/artifacts`);
      if (res.ok) {
        const data = await res.json();
        backendData = Array.isArray(data) ? data : [];
      }
    } catch (e) {}

    const localData = getStored(STORAGE_KEYS.ARTIFACTS);
    const backendIds = new Set(backendData.map((a) => a.id));
    const onlyLocal = localData.filter((a) => !backendIds.has(a.id));
    return [...backendData, ...onlyLocal];
  },
  getArtifactById: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/artifacts/${id}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    const list = getStored(STORAGE_KEYS.ARTIFACTS);
    return list.find((a) => a.id === id) || null;
  },
  saveArtifact: async (artifact) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      const isEdit = !!artifact.id;
      const url = isEdit ? `${API_BASE}/api/artifacts/${artifact.id}` : `${API_BASE}/api/artifacts`;
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        title: artifact.title,
        code: artifact.code,
        gradeId: artifact.gradeId || artifact.grade_id,
        subjectId: artifact.subjectId || artifact.subject_id,
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const saved = await res.json();
        const list = getStored(STORAGE_KEYS.ARTIFACTS);
        setStored(STORAGE_KEYS.ARTIFACTS, list.filter((a) => a.id !== artifact.id));
        return saved;
      } else {
        const errText = await res.text();
        console.error('Error HTTP al guardar artefacto:', res.status, errText);
      }
    } catch (e) {
      console.error('Excepción al guardar artefacto en backend:', e);
    }

    // Fallback local
    const list = getStored(STORAGE_KEYS.ARTIFACTS);
    if (artifact.id) {
      const index = list.findIndex((a) => a.id === artifact.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...artifact, updatedAt: new Date().toISOString() };
      }
    } else {
      artifact.id = 'art-' + Date.now();
      artifact.updatedAt = new Date().toISOString();
      list.push(artifact);
    }
    setStored(STORAGE_KEYS.ARTIFACTS, list);
    return artifact;
  },
  deleteArtifact: async (id) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      await fetch(`${API_BASE}/api/artifacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}

    let list = getStored(STORAGE_KEYS.ARTIFACTS);
    list = list.filter((a) => a.id !== id);
    setStored(STORAGE_KEYS.ARTIFACTS, list);
  },

  // Sesiones Interactivas y PIN (4 dígitos)
  createSession: async (artifactId) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      const res = await fetch(`${API_BASE}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ artifactId }),
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback local
    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    let pin;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
    } while (sessions[pin]);

    const newSession = {
      pin,
      artifactId,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
      connectedStudents: 0,
    };

    sessions[pin] = newSession;
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    return newSession;
  },

  getSessionByPin: async (pin) => {
    try {
      const res = await fetch(`${API_BASE}/api/sessions/validate/${pin}`);
      if (res.ok) return await res.json();
    } catch (e) {}

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    const session = sessions[pin];
    if (session && session.status === 'ACTIVE') {
      return session;
    }
    return null;
  },

  endSession: async (pin) => {
    try {
      const token = localStorage.getItem('inejoma_admin_token');
      await fetch(`${API_BASE}/api/sessions/${pin}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (e) {}

    const sessions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '{}');
    if (sessions[pin]) {
      sessions[pin].status = 'ENDED';
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
    return true;
  },
};
