// Transforma o JSON de um anúncio em ServiceOffer para uso nas telas do app.
// Também formata o preço inicial em reais.

class ServiceOffer {
  const ServiceOffer({
    required this.id,
    required this.title,
    required this.description,
    required this.professionalName,
    required this.startingPrice,
    required this.imageUrl,
  });

  // Lê o JSON recebido da API e escolhe o nome completo do perfil quando ele está preenchido.
  factory ServiceOffer.fromJson(Map<String, dynamic> json) {
    final freelancer = json['freelancer'] as Map<String, dynamic>;
    final profile = freelancer['profile'] as Map<String, dynamic>?;
    final fullName = (profile?['fullName'] as String?)?.trim() ?? '';

    return ServiceOffer(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String,
      professionalName: fullName.isEmpty
          ? freelancer['name'] as String
          : fullName,
      startingPrice: json['startingPrice'] as String,
      imageUrl: json['imageUrl'] as String?,
    );
  }

  final int id;
  final String title;
  final String description;
  final String professionalName;
  final String startingPrice;
  final String? imageUrl;

  String get formattedPrice {
    final parts = startingPrice.split('.');
    final whole = parts.first.replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => '.',
    );
    final cents = parts.length == 2 ? parts.last.padRight(2, '0') : '00';
    return 'R\$ $whole,$cents';
  }
}
