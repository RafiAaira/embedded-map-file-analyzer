import { useNavigate, useLocation } from 'react-router-dom';
import { Container, Stack, Group, Button } from '@mantine/core';
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react';
import type { AnalysisResult } from '../types/index';
import { MemorySummary } from './MemorySummary';
import { QuickMemorySummary } from './QuickMemorySummary';
import { MemoryChart } from './MemoryChart';
import { SectionsTable } from './SectionsTable';

export function SingleAnalysisReport() {
  const navigate = useNavigate();
  const location = useLocation();
  const result = location.state?.result as AnalysisResult | undefined;

  if (!result) {
    return (
      <Container size="xl" py="xl">
        <Stack align="center" gap="md">
          <p>No analysis data available</p>
          <Button onClick={() => navigate('/?tab=analyze')}>Go Back</Button>
        </Stack>
      </Container>
    );
  }

  return (
    <>
      <div style={{ minHeight: '100vh', width: '100%', padding: '20px 0' }}>
        <Container size="xl" px={{ base: 'md', sm: 'xl' }} style={{ maxWidth: '1600px' }}>
          <Stack gap="xl">
            {/* Header with buttons */}
            <Group justify="space-between" className="no-print">
              <Button
                variant="light"
                leftSection={<IconArrowLeft size={16} />}
                onClick={() => navigate('/?tab=analyze')}
              >
                Back to Analysis
              </Button>
              <Button
                variant="filled"
                color="grape"
                leftSection={<IconPrinter size={16} />}
                onClick={() => window.print()}
              >
                Print / Save as PDF
              </Button>
            </Group>

            {/* Memory Summary */}
            <MemorySummary result={result} hideExportButton={true} />

            {/* Quick Memory Overview */}
            <QuickMemorySummary result={result} />

            {/* Visualization Section */}
            <MemoryChart
              result={result}
              selectedSection={null}
              onSectionClick={() => {}}
            />

            {/* Sections Table */}
            <SectionsTable
              sections={result.sections}
              selectedSection={null}
              onSectionClick={() => {}}
              analysisResult={result}
            />
          </Stack>
        </Container>
      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .mantine-Paper-root {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          h1, h2, h3 {
            page-break-after: avoid;
            break-after: avoid;
          }
        }
      `}</style>
    </>
  );
}
