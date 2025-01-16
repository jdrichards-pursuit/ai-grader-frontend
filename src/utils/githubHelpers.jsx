export const extractRepoInfo = (prUrl) => {
    const match = prUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return {
        owner: match[1],
        repo: match[2]
      };
    }
    return null;
  };

  export const addRubricItem = (rubric, setRubric) => {
    setRubric([...rubric, { criterion: '', weight: 0, description: '' }]);
  };

 export const updateRubricItem = (rubric, setRubric, index, field, value) => {
    const newRubric = [...rubric];
    newRubric[index][field] = field === 'weight' ? Number(value) : value;
    setRubric(newRubric);
  };

  export const removeRubricItem = (rubric, setRubric, index) => {
    setRubric(rubric.filter((_, i) => i !== index));
  };

  export const analyzePR = async (prUrl, rubric, setLoading, setError, setAnalysis) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
      const response = await fetch(`${API_URL}/api/analysis/analyze-pr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prUrl,
          rubric
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze PR');
      }

      const analysisData = await response.json();
      console.log('Raw analysis data:', analysisData);
      setAnalysis(analysisData);
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  export const handleCopyAnalysis = (analysis) => {
    if (!analysis?.claudeResponse?.content) return;

    const formattedReport = analysis.claudeResponse.content
      .split('\n\n')
      .map(section => section.trim())
      .filter(section => section)
      .map(section => {
        if (section.match(/.*?\(\d+%\)/)) {
          return section
            .replace(/\n/g, '\n  ')
            .replace('Justification:', '\nJustification:')
            .replace('Recommendations:', '\nRecommendations:');
        }
        return section;
      })
      .join('\n\n');

    navigator.clipboard.writeText(formattedReport)
      .then(() => alert('Analysis copied to clipboard!'))
      .catch(() => alert('Failed to copy analysis'));
  };

  export const analyzePRFile = async (prUrl, filePath, rubric, setLoading, setError, setFileAnalysis) => {
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';
      const response = await fetch(`${API_URL}/api/analysis/analyze-pr-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prUrl,
          filePath,
          rubric
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze PR file');
      }

      const analysisData = await response.json();
      console.log('Response from backend:', analysisData);
      setFileAnalysis(analysisData);
    } catch (err) {
      setError(err.message);
      console.error('PR file analysis error:', err);
    } finally {
      setLoading(false);
    }
  };