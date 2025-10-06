import { useState } from 'react';
import { Paper, Text, Group, FileButton, Button, Loader, Alert, Badge, LoadingOverlay, Title, Stack } from '@mantine/core';
import { IconUpload, IconFileText, IconCheck } from '@tabler/icons-react';
import type { AnalysisResult } from '../types/index';

interface FileUploaderProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
  onFileSelect?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function FileUploader({ onAnalysisComplete, onFileSelect }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    // Clear success and error messages when a new file is selected
    setSuccess(false);
    setError(null);
    // Notify parent that a new file has been selected
    if (newFile && onFileSelect) {
      onFileSelect();
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('mapFile', file);

    try {
      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to analyze file. Please check if the file is a valid .map file.');
      }

      const data = await response.json();

      if (!data.sections || data.sections.length === 0) {
        throw new Error('No sections found in the map file. The file may be empty or invalid.');
      }

      onAnalysisComplete(data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while analyzing the file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="sm" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3} mb={4}>Upload Map File</Title>
            <Text size="sm" c="dimmed">
              Upload an embedded system .map file to analyze memory usage
            </Text>
          </div>
          <IconFileText size={32} stroke={1.5} color="var(--mantine-color-grape-6)" />
        </Group>

        <Group gap="md" align="center">
          <FileButton onChange={handleFileChange} accept=".map">
            {(props) => (
              <Button
                {...props}
                leftSection={<IconUpload size={16} />}
                variant="light"
                color="grape"
                disabled={loading}
              >
                {file ? 'Change File' : 'Select File'}
              </Button>
            )}
          </FileButton>

          {file && (
            <>
              <Group gap="xs" style={{ flex: 1 }}>
                <Text size="sm" fw={500}>{file.name}</Text>
                <Badge size="sm" variant="light" color="grape">
                  {formatFileSize(file.size)}
                </Badge>
              </Group>
              <Button
                onClick={handleAnalyze}
                disabled={loading}
                color="grape"
                leftSection={success ? <IconCheck size={16} /> : undefined}
              >
                {success ? 'Analyzed' : 'Analyze'}
              </Button>
            </>
          )}
        </Group>

        {error && (
          <Alert color="red" title="Analysis Failed" variant="light">
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" title="Success" variant="light" icon={<IconCheck size={16} />}>
            Map file analyzed successfully!
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
