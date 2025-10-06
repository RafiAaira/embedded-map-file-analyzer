import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import {
  MantineProvider,
  createTheme,
  Container,
  Title,
  Stack,
  Switch,
  Group,
  useMantineColorScheme,
  ActionIcon,
  Center,
  Box,
  Tabs,
} from '@mantine/core';
import { IconSun, IconMoon, IconChartBar, IconGitCompare } from '@tabler/icons-react';
import '@mantine/core/styles.css';

import type { AnalysisResult, DiffResult } from './types/index';
import { mockAnalysisResult } from './data/mockData';
import { FileUploader } from './components/FileUploader';
import { MemorySummary } from './components/MemorySummary';
import { SectionsTable } from './components/SectionsTable';
import { MemoryChart } from './components/MemoryChart';
import { QuickMemorySummary } from './components/QuickMemorySummary';
import { FadeIn } from './components/FadeIn';
import { AdvancedCompare } from './components/AdvancedCompare';
import { ComparisonReport } from './components/ComparisonReport';
import { SingleAnalysisReport } from './components/SingleAnalysisReport';
import { SEO, SEOPresets } from './components/SEO';
// import { LandingHero } from './components/LandingHero';
import { usePageTracking, Analytics } from './hooks/useAnalytics';

const theme = createTheme({
  primaryColor: 'grape',
  colors: {
    grape: [
      '#f3e5f5',
      '#e1bee7',
      '#ce93d8',
      '#ba68c8',
      '#ab47bc',
      '#9c27b0',
      '#8e24aa',
      '#7b1fa2',
      '#6a1b9a',
      '#4a148c',
    ],
  },
});

function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant="outline"
      color={dark ? 'yellow' : 'blue'}
      onClick={() => toggleColorScheme()}
      title="Toggle color scheme"
      size="lg"
    >
      {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
    </ActionIcon>
  );
}

function AppContent() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize Google Analytics page tracking
  usePageTracking();

  // Load result from sessionStorage on mount
  const [result, setResult] = useState<AnalysisResult | null>(() => {
    const saved = sessionStorage.getItem('analysisResult');
    return saved ? JSON.parse(saved) : mockAnalysisResult;
  });

  const [useMockData, setUseMockData] = useState(() => {
    const saved = sessionStorage.getItem('analysisResult');
    return !saved; // If no saved result, use mock data
  });

  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Load diffResult from sessionStorage on mount
  const [diffResult, setDiffResult] = useState<DiffResult | null>(() => {
    const saved = sessionStorage.getItem('diffResult');
    return saved ? JSON.parse(saved) : null;
  });

  // Get initial tab from URL or default to 'analyze'
  const [activeTab, setActiveTab] = useState<string | null>(
    searchParams.get('tab') || 'analyze'
  );

  // Update URL when tab changes
  useEffect(() => {
    if (activeTab) {
      setSearchParams({ tab: activeTab });
      // Track tab change
      Analytics.trackTabChange(activeTab);
    }
  }, [activeTab, setSearchParams]);

  // Persist diffResult to sessionStorage whenever it changes
  useEffect(() => {
    if (diffResult) {
      sessionStorage.setItem('diffResult', JSON.stringify(diffResult));
    }
  }, [diffResult]);

  // Persist analysisResult to sessionStorage whenever it changes
  useEffect(() => {
    if (result && !useMockData) {
      sessionStorage.setItem('analysisResult', JSON.stringify(result));
    }
  }, [result, useMockData]);

  const handleFileSelect = () => {
    // When a new file is selected, clear results and disable mock data
    setUseMockData(false);
    setResult(null);
    setSelectedSection(null);
  };

  const handleAnalysisComplete = (data: AnalysisResult) => {
    setResult(data);
    setUseMockData(false);
    setSelectedSection(null); // Clear any selected section

    // Track analysis completion
    const totalSize = data.sections.reduce((sum, s) => sum + s.size, 0);
    Analytics.trackAnalysis(data.sections.length, totalSize);
  };

  const handleMockDataToggle = (checked: boolean) => {
    setUseMockData(checked);
    if (checked) {
      setResult(mockAnalysisResult);
      setSelectedSection(null); // Clear any selected section
      sessionStorage.removeItem('analysisResult'); // Clear persisted result
    } else {
      setResult(null);
      sessionStorage.removeItem('analysisResult'); // Clear persisted result
    }

    // Track mock data toggle
    Analytics.trackMockDataToggle(checked);
  };

  const handleSectionClick = (sectionName: string) => {
    setSelectedSection(prev => prev === sectionName ? null : sectionName);

    // Track section click
    Analytics.trackSectionClick(sectionName);
  };

  const handleDiffComplete = (result: DiffResult) => {
    setDiffResult(result);

    // Track comparison completion
    const build1Size = result.summary.totalSizeV1;
    const build2Size = result.summary.totalSizeV2;
    const sizeDiff = result.summary.totalSizeDiff;
    Analytics.trackComparison(build1Size, build2Size, sizeDiff);
  };

  const displayResult = useMockData ? mockAnalysisResult : result;

  // Determine SEO based on active tab
  const getSEOProps = () => {
    if (activeTab === 'analyze') return SEOPresets.analyze;
    if (activeTab === 'compare') return SEOPresets.compare;
    return SEOPresets.home;
  };

  return (
    <>
      <SEO {...getSEOProps()} />
      <Box style={{ minHeight: '100vh', width: '100%' }} py="xl">
        <Container size="xl" px={{ base: 'md', sm: 'xl' }} style={{ maxWidth: '1600px' }}>
          <Stack gap="xl">
          {/* Header */}
          <Center>
            <Stack gap="md" align="center">
              <Group gap="md">
                <Title order={1} c="grape">Embedded Map File Analyzer</Title>
                <Group gap="xs">
                  <Switch
                    label="Mock Data"
                    checked={useMockData}
                    onChange={(event) => handleMockDataToggle(event.currentTarget.checked)}
                  />
                  <ThemeToggle />
                </Group>
              </Group>
              <Title order={4} fw={400} c="dimmed">
                Analyze and visualize embedded system memory usage
              </Title>
            </Stack>
          </Center>

          {/* Main Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab} color="grape">
            <Tabs.List>
              <Tabs.Tab value="analyze" leftSection={<IconChartBar size={16} />}>
                Single Analysis
              </Tabs.Tab>
              <Tabs.Tab value="compare" leftSection={<IconGitCompare size={16} />}>
                Build Comparison
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="analyze" pt="xl">
              <Stack gap="xl">
                {/* File Uploader */}
                <FileUploader
                  onAnalysisComplete={handleAnalysisComplete}
                  onFileSelect={handleFileSelect}
                />

                {displayResult && (
                  <>
                    {/* Summary Section */}
                    <FadeIn delay={100}>
                      <MemorySummary result={displayResult} />
                    </FadeIn>

                    {/* Quick Memory Overview */}
                    <FadeIn delay={150}>
                      <QuickMemorySummary result={displayResult} />
                    </FadeIn>

                    {/* Visualization Section */}
                    <FadeIn delay={200}>
                      <MemoryChart
                        result={displayResult}
                        selectedSection={selectedSection}
                        onSectionClick={handleSectionClick}
                      />
                    </FadeIn>

                    {/* Sections Table */}
                    <FadeIn delay={300}>
                      <SectionsTable
                        sections={displayResult.sections}
                        selectedSection={selectedSection}
                        onSectionClick={handleSectionClick}
                        analysisResult={displayResult}
                      />
                    </FadeIn>
                  </>
                )}
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="compare" pt="xl">
              <Stack gap="xl">
                {/* Build Comparison with Advanced Features */}
                <AdvancedCompare
                  onDiffComplete={handleDiffComplete}
                  diffResult={diffResult}
                />
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </Box>
    </>
  );
}

function App() {
  return (
    <HelmetProvider>
      <MantineProvider theme={theme} defaultColorScheme="auto">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppContent />} />
            <Route path="/comparison-report" element={<ComparisonReport />} />
            <Route path="/analysis-report" element={<SingleAnalysisReport />} />
          </Routes>
        </BrowserRouter>
      </MantineProvider>
    </HelmetProvider>
  );
}

export default App;
