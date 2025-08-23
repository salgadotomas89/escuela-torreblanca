$(window).scroll(function() {
    var scrollPosition = $(this).scrollTop();
    var windowHeight = $(this).height();
    
    $('.scroll-animation').each(function() {
      var elementPosition = $(this).offset().top;
      
      if (elementPosition - windowHeight + 100 < scrollPosition) {
        $(this).addClass('animate');
      }
    });
  });
  