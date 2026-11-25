import 'package:flutter/material.dart';

import 'freelike_api.dart';
import 'freelike_brand.dart';
import 'service.dart';
import 'service_cover.dart';
import 'service_detail_screen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key, required this.api, required this.onLogout});

  final FreelikeApi api;
  final VoidCallback onLogout;

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  List<ServiceOffer> _services = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final services = await widget.api.catalog();
      if (mounted) setState(() => _services = services);
    } catch (error) {
      if (mounted) {
        setState(() {
          _error = error is ApiError
              ? error.message
              : 'Não foi possível carregar a vitrine.';
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _openService(ServiceOffer offer) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) =>
            ServiceDetailScreen(api: widget.api, serviceId: offer.id),
      ),
    );
  }

  Widget _status() {
    if (_loading) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            children: [
              SizedBox.square(
                dimension: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              SizedBox(height: 12),
              Text('Carregando anúncios...'),
            ],
          ),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              _error ?? 'Nenhum anúncio publicado.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            TextButton(onPressed: _load, child: const Text('Atualizar')),
          ],
        ),
      ),
    );
  }

  Widget _offerCard(BuildContext context, ServiceOffer offer) {
    final cover = widget.api.coverUrl(offer.imageUrl);
    final theme = Theme.of(context);
    final colors = theme.colorScheme;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => _openService(offer),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (cover != null) ServiceCover(url: cover),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(offer.title, style: theme.textTheme.titleLarge),
                  const SizedBox(height: 4),
                  Text(
                    offer.professionalName,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colors.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Divider(height: 1),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: Text.rich(
                          TextSpan(
                            text: 'A partir de ',
                            children: [
                              TextSpan(
                                text: offer.formattedPrice,
                                style: theme.textTheme.titleMedium?.copyWith(
                                  color: colors.primary,
                                ),
                              ),
                            ],
                          ),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                        ),
                      ),
                      Icon(Icons.chevron_right, color: colors.primary),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final showOffers = !_loading && _error == null && _services.isNotEmpty;
    return Scaffold(
      appBar: AppBar(
        title: const FreelikeBrand(),
        actions: [
          OutlinedButton.icon(
            onPressed: widget.onLogout,
            icon: const Icon(Icons.logout_rounded, size: 18),
            label: const Text('Sair'),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 640),
            child: RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 24, 16, 24),
                itemCount: showOffers ? _services.length + 1 : 2,
                itemBuilder: (context, index) {
                  if (index == 0) {
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: Text(
                        'Vitrine de serviços',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                    );
                  }
                  if (!showOffers) return _status();
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _offerCard(context, _services[index - 1]),
                  );
                },
              ),
            ),
          ),
        ),
      ),
    );
  }
}
