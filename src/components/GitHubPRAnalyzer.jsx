import { useState } from 'react';
import { extractRepoInfo, addRubricItem, updateRubricItem, removeRubricItem, analyzePR, handleCopyAnalysis, analyzePRFile } from '../utils/githubHelpers';
const GitHubPRAnalyzer = () => {
  const [prUrl, setPrUrl] = useState('');
  const [rubric, setRubric] = useState([
    { criterion: 'Code Quality', weight: 25, description: 'Clean, readable, and maintainable code' },
    { criterion: 'Best Practices', weight: 25, description: 'Following industry standards and patterns' },
    { criterion: 'Code Completion', weight: 25, description: 'Code completion is 100%, Modify score based on the percentage of code completion' }
  ]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentName, setStudentName] = useState('');
  const [filePath, setFilePath] = useState('');
  const [fileAnalysis, setFileAnalysis] = useState(null);

  // Use the functions with state and setters
  const handleAddRubricItem = () => addRubricItem(rubric, setRubric);
  
  const handleUpdateRubricItem = (index, field, value) => updateRubricItem(rubric, setRubric, index, field, value);

  const handleRemoveRubricItem = (index) => removeRubricItem(rubric, setRubric, index);

  const handleAnalyzePR = () => analyzePR(prUrl, rubric, setLoading, setError, setAnalysis);

  const handleAnalyzePRFile = () => analyzePRFile(prUrl, filePath, rubric, setLoading, setError, setFileAnalysis);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4"> Pull Request Grader</h1>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Grading Rubric</h3>
          {rubric.map((item, index) => (
            <div key={index} className="flex gap-4 items-start">
              <input
                type="text"
                value={item.criterion}
                onChange={(e) => handleUpdateRubricItem(index, 'criterion', e.target.value)}
                placeholder="Criterion"
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={item.weight}
                onChange={(e) => handleUpdateRubricItem(index, 'weight', e.target.value)}
                placeholder="Weight %"
                className="w-24 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                value={item.description}
                onChange={(e) => handleUpdateRubricItem(index, 'description', e.target.value)}
                placeholder="Description"
                className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleRemoveRubricItem(index)}
                className="px-3 py-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={handleAddRubricItem}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Add Criterion
          </button>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Student Information</h3>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter student's name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <input
            type="text"
            value={prUrl}
            onChange={(e) => setPrUrl(e.target.value)}
            placeholder="Enter GitHub PR URL"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyzePR}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze PR'}
          </button>
        </div>

        <div className="space-y-4 mt-4">
          <input
            type="text"
            value={filePath}
            onChange={(e) => setFilePath(e.target.value)}
            placeholder="Enter file path to analyze from PR (optional)"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyzePRFile}
            disabled={loading || !prUrl || !filePath}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze PR File'}
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className="p-4 bg-blue-100 text-blue-700 rounded flex items-center gap-2">
            <span>⏳</span>
            <span>Analyzing PR with Claude AI...</span>
          </div>
        )}

        {(analysis || fileAnalysis) && (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold">
                {studentName ? `${studentName}'s Results` : 'Analysis Results'}
              </h2>
              {prUrl && extractRepoInfo(prUrl) && (
                <p className="text-gray-600 mt-1">
                  Repository: {extractRepoInfo(prUrl).owner}/{extractRepoInfo(prUrl).repo}
                </p>
              )}
            </div>

            {analysis && !fileAnalysis && (
              <div className="space-y-6">
                {/* Overall Score */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h2 className="text-xl font-bold mb-4">Overall Score</h2>
                  <div className="text-2xl">
                    {`${analysis.criteriaScores.reduce((acc, criteria) => {
                      if (criteria.criterion === 'Code Completion') {
                        const completionScore = Math.round((analysis.functionAnalysis.completionPercentage / 100) * criteria.weight);
                        return acc + completionScore;
                      }
                      return acc + (criteria.score || 0);
                    }, 0)}/${analysis.criteriaScores.reduce((sum, item) => sum + item.weight, 0)}`}
                  </div>
                </div>

                {/* Criteria Analysis Cards */}
                <div className="grid grid-cols-1 gap-6">
                  {analysis.criteriaScores.map((criteria, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{criteria.criterion}</h3>
                        <div className="text-2xl font-bold">
                          {criteria.criterion === 'Code Completion' ? 
                            `${Math.round((analysis.functionAnalysis.completionPercentage / 100) * criteria.weight)}/${criteria.weight}` :
                            `${criteria.score}/${criteria.weight}`
                          }
                        </div>
                      </div>
                      
                      {criteria.criterion === 'Code Completion' && (
                        <div className="mb-4 text-sm text-gray-600">
                          <p>Total Functions: {analysis.functionAnalysis.totalFunctions}</p>
                          <p>Implemented Functions: {analysis.functionAnalysis.implementedFunctions}</p>
                          <p>Completion Rate: {analysis.functionAnalysis.completionPercentage.toFixed(1)}%</p>
                        </div>
                      )}
                      
                      {criteria.justification && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">Justification</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {criteria.justification}
                          </p>
                        </div>
                      )}
                      
                      {criteria.recommendations && criteria.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Recommendations</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {criteria.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall Analysis */}
                {analysis.claudeResponse?.overallAnalysis && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Overall Analysis</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {analysis.claudeResponse.overallAnalysis}
                    </p>
                  </div>
                )}

                {/* Copy Report Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopyAnalysis(analysis)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Full Report
                  </button>
                </div>
              </div>
            )}

            {fileAnalysis && (
              <div className="space-y-6">
                {/* File Changes */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-gray-100 rounded">
                    <div className="text-lg font-semibold">Status</div>
                    <div className="text-2xl">{fileAnalysis.changes?.status || 'unknown'}</div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded">
                    <div className="text-lg font-semibold">Added Lines</div>
                    <div className="text-2xl text-green-600">+{fileAnalysis.changes?.additions || 0}</div>
                  </div>
                  <div className="p-4 bg-gray-100 rounded">
                    <div className="text-lg font-semibold">Removed Lines</div>
                    <div className="text-2xl text-red-600">-{fileAnalysis.changes?.deletions || 0}</div>
                  </div>
                </div>

                {/* Overall Score */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-4">
                  <h2 className="text-xl font-bold mb-4">Overall Score</h2>
                  <div className="text-2xl">
                    {fileAnalysis?.criteriaScores ? 
                      `${fileAnalysis.criteriaScores.reduce((acc, criteria) => {
                        console.log('Processing criterion:', criteria);
                        if (criteria.criterion === 'Code Completion') {
                          const completionScore = Math.round((fileAnalysis.functionAnalysis.completionPercentage / 100) * criteria.weight);
                          console.log('Completion score:', completionScore);
                          return acc + completionScore;
                        }
                        console.log('Regular score:', criteria.score);
                        return acc + criteria.score;
                      }, 0)}/${rubric.reduce((sum, item) => sum + item.weight, 0)}` : 
                      'Score pending'}
                  </div>
                </div>

                {/* Criteria Analysis Cards */}
                <div className="grid grid-cols-1 gap-6">
                  {fileAnalysis.criteriaScores?.map((criteria, index) => (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold">{criteria.criterion}</h3>
                        <div className="text-2xl font-bold">
                          {criteria.criterion === 'Code Completion' ? 
                            `${Math.round((fileAnalysis.functionAnalysis.completionPercentage / 100) * criteria.weight)}/${criteria.weight}` :
                            `${criteria.score}/${criteria.weight}`
                          }
                        </div>
                      </div>
                      
                      {criteria.criterion === 'Code Completion' && (
                        <div className="mb-4 text-sm text-gray-600">
                          <p>Total Functions: {fileAnalysis.functionAnalysis.totalFunctions}</p>
                          <p>Implemented Functions: {fileAnalysis.functionAnalysis.implementedFunctions}</p>
                          <p>Completion Rate: {fileAnalysis.functionAnalysis.completionPercentage.toFixed(1)}%</p>
                        </div>
                      )}
                      
                      {criteria.justification && (
                        <div className="mb-4">
                          <h4 className="text-lg font-semibold mb-2">Justification</h4>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {criteria.justification}
                          </p>
                        </div>
                      )}
                      
                      {criteria.recommendations && criteria.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-lg font-semibold mb-2">Recommendations</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            {criteria.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall Analysis */}
                {fileAnalysis.claudeResponse?.overallAnalysis && (
                  <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-4">Overall Analysis</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {fileAnalysis.claudeResponse.overallAnalysis}
                    </p>
                  </div>
                )}

                {/* File Content */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4">File Content</h3>
                  <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                    {fileAnalysis.fileContent}
                  </pre>
                </div>

                {/* Copy Report Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCopyAnalysis(fileAnalysis)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copy Full Report
                  </button>
                </div>

                {/* Raw Claude Response */}
                {fileAnalysis.claudeResponse && (
                  <div className="mt-6">
                    <details className="bg-white p-4 rounded border">
                      <summary className="font-semibold cursor-pointer">Raw Analysis Details</summary>
                      <div className="mt-4 space-y-4">
                        <div className="whitespace-pre-wrap text-gray-700">
                          {fileAnalysis.claudeResponse.content}
                        </div>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GitHubPRAnalyzer;