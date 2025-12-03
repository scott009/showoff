/**
 * Translation Master Form Submission Handler
 *
 * This script handles submitting corrections to both:
 * 1. Netlify serverless function (commits to GitHub)
 * 2. Local download (backup option)
 *
 * Usage: Include this script in your tmaster HTML files
 * Update NETLIFY_FUNCTION_URL with your actual Netlify function URL
 */

// Netlify function URL
const NETLIFY_FUNCTION_URL = 'https://statuesque-moonbeam-289585.netlify.app/.netlify/functions/submit-corrections';

/**
 * Submit corrections to GitHub via Netlify function
 */
async function submitToGitHub(correctionsData) {
  try {
    const response = await fetch(NETLIFY_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(correctionsData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to submit corrections');
    }

    return {
      success: true,
      data: result
    };

  } catch (error) {
    console.error('Error submitting to GitHub:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Download corrections as JSON file (backup method)
 */
function downloadCorrections(correctionsData, language) {
  const jsonStr = JSON.stringify(correctionsData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  a.download = `${language}_corrections_${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Main submission handler
 */
async function handleFormSubmission(correctionsData) {
  const language = correctionsData.metadata.language;
  const itemCount = correctionsData.corrections.length;
  const chapterCount = correctionsData.metadata.chapters_covered.length;

  // Show loading state
  const submitBtn = document.getElementById('download-btn');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    // Try to submit to GitHub first
    const result = await submitToGitHub(correctionsData);

    if (result.success) {
      // Success! Show confirmation
      alert(
        `✓ Successfully submitted to GitHub!\n\n` +
        `${itemCount} corrections saved across ${chapterCount} chapters.\n\n` +
        `File: ${result.data.file}\n\n` +
        `A backup JSON file will also be downloaded to your computer.`
      );

      // Also download as backup
      downloadCorrections(correctionsData, language);

      // Optionally redirect to the commit
      if (result.data.commit_url && confirm('Would you like to view the commit on GitHub?')) {
        window.open(result.data.commit_url, '_blank');
      }

    } else {
      // GitHub submission failed - fallback to download only
      console.error('GitHub submission failed:', result.error);

      if (confirm(
        `⚠️ Could not submit to GitHub: ${result.error}\n\n` +
        `Would you like to download the corrections as a JSON file instead?\n` +
        `You can manually share this file with the project maintainer.`
      )) {
        downloadCorrections(correctionsData, language);
        alert(`✓ Downloaded corrections for ${itemCount} items across ${chapterCount} chapters!`);
      }
    }

  } catch (error) {
    console.error('Unexpected error:', error);

    // Fallback to download
    if (confirm(
      `⚠️ An unexpected error occurred.\n\n` +
      `Would you like to download the corrections as a JSON file instead?`
    )) {
      downloadCorrections(correctionsData, language);
      alert(`✓ Downloaded corrections for ${itemCount} items across ${chapterCount} chapters!`);
    }

  } finally {
    // Restore button state
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
