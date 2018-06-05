$(window).on("scroll", function(event) {
  var scrollPos = $(document).scrollTop();
  $('.navbar-nav a').each(function() {
    var currLink = $(this);
    var refElement = $(currLink.attr("href"));
    var navbar = $(".navbar");
    if (refElement.position().top <= scrollPos + navbar.height() && refElement.position().top + refElement.height() > scrollPos - navbar.height()) {
      $('.navbar-nav a').removeClass("active");
      currLink.addClass("active");
    } else {
      currLink.removeClass("active");
    }
  });
});
