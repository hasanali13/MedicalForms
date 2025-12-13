using System;
using System.Collections.Generic;

namespace Medical.Models.ViewModels
{
    public class DashboardViewModel
    {
        public int TotalSubmissions { get; set; }
        public int TodaySubmissions { get; set; }
        public ViewPublicForm? LastSubmission { get; set; }
        public List<ViewPublicForm> RecentSubmissions { get; set; } = new List<ViewPublicForm>();
        public List<DailySubmissionStat> Last7DaysStats { get; set; } = new List<DailySubmissionStat>();
    }

    public class DailySubmissionStat
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }
}
