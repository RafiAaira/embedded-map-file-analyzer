import { useState } from 'react';
import { Paper, Text, Group, FileButton, Button, Alert, Badge, LoadingOverlay, Title, Stack, Grid, NumberInput } from '@mantine/core';
import { IconUpload, IconFileText, IconCheck, IconX, IconGitCompare } from '@tabler/icons-react';
import type { CompareResult } from '../types/index';

interface BuildCompareProps {
  onCompareComplete: (result: CompareResult) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function BuildCompare({ onCompareComplete }: BuildCompareProps) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Comparison options
  const [topN, setTopN] = useState(20);
  const [anomalyThresholdPct, setAnomalyThresholdPct] = useState(20);
  const [anomalyThresholdBytes, setAnomalyThresholdBytes] = useState(1024);

  const handleFileAChange = (file: File | null) => {
    setFileA(file);
    setSuccess(false);
    setError(null);
  };

  const handleFileBChange = (file: File | null) => {
    setFileB(file);
    setSuccess(false);
    setError(null);
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append('fileA', fileA);
    formData.append('fileB', fileB);

    try {
      const queryParams = new URLSearchParams({
        topN: topN.toString(),
        anomalyThresholdPct: anomalyThresholdPct.toString(),
        anomalyThresholdBytes: anomalyThresholdBytes.toString(),
        includeUnchanged: 'false',
      });

      const response = await fetch(`http://localhost:5000/compare?${queryParams}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Comparison failed:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to compare files. Please check that both files are valid .map files.');
      }

      const data = await response.json();

      if (!data || !data.summary) {
        throw new Error('Invalid response from server');
      }

      onCompareComplete(data);
      setSuccess(true);
    } catch (err) {
      console.error('Comparison error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while comparing files');
    } finally {
      setLoading(false);
    }
  };

  const canCompare = fileA && fileB && !loading;

  return (
    <Paper shadow="sm" p="xl" withBorder pos="relative">
      <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={3} mb={4}>Compare Two Builds</Title>
            <Text size="sm" c="dimmed">
              Upload two .map files to compare memory usage and detect anomalies
            </Text>
          </div>
          <IconGitCompare size={32} stroke={1.5} color="var(--mantine-color-grape-6)" />
        </Group>

        <Grid gutter="md">
          {/* Build A */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" withBorder style={{ height: '100%' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Build A (Baseline)</Text>
                  <IconFileText size={20} color="var(--mantine-color-blue-6)" />
                </Group>

                <FileButton onChange={handleFileAChange} accept=".map">
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      variant="light"
                      color="blue"
                      fullWidth
                      disabled={loading}
                    >
                      {fileA ? 'Change File A' : 'Select File A'}
                    </Button>
                  )}
                </FileButton>

                {fileA && (
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={500} style={{ flex: 1 }} truncate>{fileA.name}</Text>
                    <Badge size="sm" variant="light" color="blue">
                      {formatFileSize(fileA.size)}
                    </Badge>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Grid.Col>

          {/* Build B */}
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Paper p="md" withBorder style={{ height: '100%' }}>
              <Stack gap="sm">
                <Group justify="space-between">
                  <Text fw={600} size="sm">Build B (New)</Text>
                  <IconFileText size={20} color="var(--mantine-color-green-6)" />
                </Group>

                <FileButton onChange={handleFileBChange} accept=".map">
                  {(props) => (
                    <Button
                      {...props}
                      leftSection={<IconUpload size={16} />}
                      variant="light"
                      color="green"
                      fullWidth
                      disabled={loading}
                    >
                      {fileB ? 'Change File B' : 'Select File B'}
                    </Button>
                  )}
                </FileButton>

                {fileB && (
                  <Group gap="xs" wrap="nowrap">
                    <Text size="sm" fw={500} style={{ flex: 1 }} truncate>{fileB.name}</Text>
                    <Badge size="sm" variant="light" color="green">
                      {formatFileSize(fileB.size)}
                    </Badge>
                  </Group>
                )}
              </Stack>
            </Paper>
          </Grid.Col>
        </Grid>

        {/* Comparison Options */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={600} size="sm">Comparison Options</Text>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Top N Changes"
                  description="Number of top increases/decreases"
                  value={topN}
                  onChange={(val) => setTopN(Number(val) || 20)}
                  min={5}
                  max={100}
                  disabled={loading}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Anomaly Threshold (%)"
                  description="Percentage change threshold"
                  value={anomalyThresholdPct}
                  onChange={(val) => setAnomalyThresholdPct(Number(val) || 20)}
                  min={1}
                  max={100}
                  disabled={loading}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <NumberInput
                  label="Anomaly Threshold (Bytes)"
                  description="Absolute size change threshold"
                  value={anomalyThresholdBytes}
                  onChange={(val) => setAnomalyThresholdBytes(Number(val) || 1024)}
                  min={100}
                  max={10000}
                  step={256}
                  disabled={loading}
                />
              </Grid.Col>
            </Grid>
          </Stack>
        </Paper>

        {/* Compare Button */}
        <Button
          onClick={handleCompare}
          disabled={!canCompare}
          color="grape"
          size="lg"
          leftSection={success ? <IconCheck size={20} /> : <IconGitCompare size={20} />}
          fullWidth
        >
          {success ? 'Comparison Complete' : 'Compare Builds'}
        </Button>

        {error && (
          <Alert color="red" title="Comparison Failed" variant="light" icon={<IconX size={16} />}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert color="green" title="Success" variant="light" icon={<IconCheck size={16} />}>
            Build comparison completed successfully! View results below.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
