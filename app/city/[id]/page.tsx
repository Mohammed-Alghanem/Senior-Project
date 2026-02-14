'use client';

import { useParams, useRouter } from 'next/navigation';
import { getCityById } from '@/app/data/mockData';
import { Header } from '@/app/components/Header';
import { CityInfoPanel } from '@/app/components/CityInfoPanel';
import { Container, Flex, Grid } from '@/app/components/Layout';
import { theme } from '@/app/styles/colors';
import { ArrowLeft } from 'lucide-react';

export default function CityDetail() {
  const params = useParams();
  const router = useRouter();
  const cityId = params.id as string;

  const city = getCityById(cityId);

  if (!city) {
    return (
      <div style={{ background: theme.neutral.gray[50], minHeight: '100vh' }}>
        <Header title="City Not Found" />
        <Container padding="32px">
          <div style={{ textAlign: 'center', paddingY: '64px' }}>
            <p style={{ fontSize: '16px', color: theme.neutral.gray[600], marginBottom: '20px' }}>
              The city you're looking for doesn't exist.
            </p>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '12px 24px',
                background: theme.primary.main,
                color: theme.neutral.white,
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ background: theme.background.gradient, minHeight: '100vh' }}>
      <Header title={city.name} subtitle={`${city.region} Region`} />

      <Container padding="32px">
        <Flex direction="column" gap="24px">
          {/* Back Button */}
          <button
            onClick={() => router.push('/')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'transparent',
              border: 'none',
              color: theme.neutral.white,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              padding: '8px 0',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>

          {/* Main Content Grid */}
          <Grid columns={1} gap="24px">
            <div
              style={{
                background: theme.neutral.white,
                borderRadius: '8px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }}
            >
              <CityInfoPanel
                cityName={city.name}
                region={city.region}
                population={city.population}
                floodData={city.floodData}
              />
            </div>
          </Grid>
        </Flex>
      </Container>
    </div>
  );
}
