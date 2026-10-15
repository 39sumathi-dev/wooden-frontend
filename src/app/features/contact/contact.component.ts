import { Component, signal, inject, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent implements AfterViewInit {
  private el = inject(ElementRef);

  formData = {
    name: '',
    email: '',
    phone: '',
    projectType: 'Bespoke Bowl or Platter',
    timber: 'Open to suggestion',
    dimensions: '',
    message: ''
  };

  submitted = signal(false);
  submitting = signal(false);

  projectTypes = [
    'Bespoke Bowl or Platter',
    'Sculptural Turned Vase',
    'Custom Tableware Set (Restaurants / Chefs)',
    'Writing Instruments Commission',
    'Architectural / Special Turning',
    'General Inquiry'
  ];

  timberOptions = [
    'Open to suggestion',
    'American White Oak',
    'American Black Walnut',
    "Bird's Eye Maple",
    'Reclaimed Teak',
    'Indian Rosewood',
    'African Ebony'
  ];

  faqs = [
    {
      q: 'How do I care for and oil a handcrafted wooden bowl?',
      a: 'Wash by hand immediately after use with lukewarm water and mild dish soap. Dry thoroughly with a cloth. Never soak in water and never place in a dishwasher. Once a month, rub a small amount of food-safe walnut oil or mineral oil into the surface and buff with a soft cloth.'
    },
    {
      q: 'How long does a bespoke turning commission take?',
      a: 'Most custom orders require between 2 to 4 weeks depending on timber seasoning, wall thickness, and multi-stage curing of natural oil finishes. We will confirm your delivery timeline when we review your specifications.'
    },
    {
      q: 'Can custom bowls be used for warm foods and dressings?',
      a: 'Yes. Our salad and dining bowls are finished with pure cold-pressed walnut oil and natural beeswax, fully food-safe and moisture-repellent. Avoid boiling liquids or microwave reheating, as high heat can induce thermal stress in natural wood fibres.'
    },
    {
      q: 'Do you ship nationally and internationally?',
      a: 'We ship across India with reinforced double-box protective packaging, insured against transit shock. For international deliveries, please contact us with your shipping destination for calculated duties and courier rates.'
    }
  ];

  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) e.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );

    const revealElements = this.el.nativeElement.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    revealElements.forEach((elem: Element) => observer.observe(elem));
  }

  onSubmit() {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
    }, 900);
  }

  resetForm() {
    this.formData = {
      name: '',
      email: '',
      phone: '',
      projectType: 'Bespoke Bowl or Platter',
      timber: 'Open to suggestion',
      dimensions: '',
      message: ''
    };
    this.submitted.set(false);
  }
}
